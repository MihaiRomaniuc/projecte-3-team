const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

// Clases
const { LiveGames } = require('./models/liveGames');
const { Players } = require('./models/players');
const { Teams } = require('./models/teams');

const publicPath = path.join(__dirname, '../public');
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var games = new LiveGames();
var players = new Players();
var teams = new Teams();
var playerId;

// Base de datos
var mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    image: String,
    question: String,
    answers: Array,
    correct: Number
}, { _id: false });

const quizGameSchema = new mongoose.Schema({
    id: Number,
    name: String,
    questions: [questionSchema]
}, { versionKey: false });

const QuizGame = mongoose.model('QuizGame', quizGameSchema);

const teamSchema = new mongoose.Schema({
    id: Number,
    name: String,
    img: String,
    used: Boolean
});

const Team = mongoose.model('Team', teamSchema);


app.use(express.static(publicPath));

server.listen(3000, '0.0.0.0', () => {
    console.log(`Server running on http://127.0.0.1:3000`);
});

const handleTeamsRequest = async (hostId) => {
    let teamsData;

    try {
        // Establecer la conexión a la base de datos
        const connection = await mongoose.connect('mongodb://127.0.0.1:27017/FootballQuizDB');

        // Realizar operaciones en la base de datos
        teamsData = await Team.find({}, 'id name img used');

        teamsData.forEach(team => {
            teams.addTeam(team.id, team.name, team.img, hostId, team.used);
        });
    } catch (err) {
        console.error('Error al obtener la lista de equipos:', err);
    }

    return teamsData;
};

io.on('connection', (socket) => {

    // Lógica para enviar la lista de equipos al cliente
    socket.on('request-teams', async () => {
        try {
            const teamsData = teams.getAllTeams();
            const player = players.getPlayer(playerId);

            socket.emit('teamsData', { teamsData, player });
        } catch (err) {
            console.error('Error al obtener la lista de equipos:', err);
        }
    });

    // Lógica para asignar un equipo al jugador
    socket.on('set-team', ({ playerId, selectedTeamId }) => {
        try {
            players.assignTeam(playerId, selectedTeamId);
            teams.markTeamAsUsed(selectedTeamId);
            io.emit('update-teams', teams.getAllTeams());
        } catch (err) {
            console.error('Error al asignar el equipo:', err);
        }
    });

    // Cuando el host se conecta por primera vez
    socket.on('host-join', async (data) => {

        // Comprueba si el id pasado en la URL corresponde al id del juego de preguntas en la base de datos
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/FootballQuizDB');

            const query = { id: parseInt(data.id) };
            const result = await QuizGame.find(query).exec();

            // Se encontró un cuestionario con el ID pasado en la URL
            if (result.length > 0) {
                const gamePin = Math.floor(Math.random() * 90000) + 10000; // Nuevo pin para el juego

                games.addGame(gamePin, socket.id, false, { playersAnswered: 0, questionLive: false, gameid: data.id, question: 1 });

                const game = games.getGame(socket.id); // Obtiene los datos del juego

                socket.join(game.pin); // El anfitrión se une a una habitación basada en el pin

                console.log('Game Created with pin:', game.pin);
                await handleTeamsRequest(socket.id);

                // Envía el pin del juego al anfitrión para que pueda mostrarlo a los jugadores para que se unan
                socket.emit('showGamePin', {
                    pin: game.pin
                });
            } else {
                socket.emit('noGameFound');
            }
        } catch (err) {
            console.error(err);
        } finally {
            mongoose.connection.close();
        }
    });

    // Cuando el anfitrión se conecta desde la vista del juego
    socket.on('host-join-game', async (data) => {
        try {
            const oldHostId = data.id;
            const game = games.getGame(oldHostId); // Obtiene el juego con el antiguo id del host

            if (game) {
                game.hostId = socket.id; // Cambia el id del host del juego al nuevo id del host
                socket.join(game.pin);

                const playerData = players.getPlayers(oldHostId); // Introduce al jugador en el juego.
                for (let i = 0; i < players.players.length; i++) {
                    if (players.players[i].hostId == oldHostId) {
                        players.players[i].hostId = socket.id;
                    }
                }

                const gameid = game.gameData['gameid'];
                await mongoose.connect('mongodb://127.0.0.1:27017/FootballQuizDB');

                const quizGame = await QuizGame.findOne({ id: parseInt(gameid) }).exec();

                if (quizGame) {
                    const question = quizGame.questions[0].question;
                    const answers = quizGame.questions[0].answers;
                    const correctAnswer = quizGame.questions[0].correct;
                    const length = quizGame.questions.length;

                    socket.emit('gameQuestions', {
                        questionNum: 1,
                        length: length,
                        q1: question,
                        a1: answers[0],
                        a2: answers[1],
                        a3: answers[2],
                        a4: answers[3],
                        correct: correctAnswer,
                        playersInGame: playerData.length
                    });

                    io.to(game.pin).emit('gameStartedPlayer');
                    game.gameData.questionLive = true;

                    setTimeout(() => {
                        io.to(game.pin).emit('getQuestion', {
                            questionNum: 1,
                            length: length,
                            q1: question,
                            a1: answers[0],
                            a2: answers[1],
                            a3: answers[2],
                            a4: answers[3],
                        });
                    }, 1000);

                } else {
                    socket.emit('noGameFound');
                }

                mongoose.connection.close();
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Cuando el jugador se conecta por primera vez
    socket.on('player-join', (params) => {

        var gameFound = false; // Si se encuentra un juego con el pin proporcionado por el jugador

        //Para cada juego de la clase Juegos
        for (var i = 0; i < games.games.length; i++) {
            //Si el pin es igual a uno de los pin del juego
            if (params.pin == games.games[i].pin) {

                console.log(params.name + ' connected to game');

                var hostId = games.games[i].hostId; //Obtienes el id del host del juego

                players.addPlayer(hostId, socket.id, params.name, { score: 0, answer: 0 }); //añade jugador al juego

                playerId = socket.id;

                socket.join(params.pin); //El jugador se une a la sala según el pin

                var playersInGame = players.getPlayers(hostId);

                io.to(params.pin).emit('updatePlayerLobby', playersInGame); //Enviando datos del jugador anfitrión para mostrar
                gameFound = true; //El juego ha sido encontrado
            }
        }

        if (gameFound == false) {
            socket.emit('noGameFound'); //El jugador regresa a la página 'unirse' porque no se encontró el juego con ese pin
        }

    });

    // Cuando el jugador se conecta desde la vista del juego
    socket.on('player-join-game', (data) => {
        var player = players.getPlayer(data.id);
        if (player) {
            var game = games.getGame(player.hostId);
            socket.join(game.pin);
            player.playerId = socket.id; // Actualiza el ID del jugador con el ID del socket

            var playerData = players.getPlayers(game.hostId);
            socket.emit('playerGameData', playerData);
        } else {
            socket.emit('noGameFound');
        }

    });

    //Maneja las desconexiones, tanto del host como del jugador 
    socket.on('disconnect', () => {
        var game = games.getGameByHostId(socket.id);

        if (game) { //Maneja la desconexion del host
            if (!game.gameLive) {
                // El juego no ha comenzado, limpiar recursos
                games.removeGame(socket.id);

                var playersToRemove = players.getPlayers(socket.id);

                for (var i = 0; i < playersToRemove.length; i++) {
                    players.removePlayer(playersToRemove[i].playerId);
                }

                var teamsToRemove = teams.getAllTeams().filter(team => team.hostId === game.hostId);

                for (const teamToRemove of teamsToRemove) {
                    teams.removeTeam(teamToRemove.id);
                }

                io.to(game.pin).emit('hostDisconnect');
                socket.leave(game.pin);
            } else { // El juego esta iniciado
                // Finaliza la partida inmediatamente y envia un mensaje a los jugadores
                io.to(game.pin).emit('gameEnded', { reason: 'hostDisconnected' });
            }
        } else {
            // No se ha encontrado ningún juego, por lo que es un socket de jugador el que se ha desconectado
            var player = players.getPlayer(socket.id); // Obteniendo reproductor con socket.id
            // Si se encuentra un jugador con ese id.
            if (player) {
                var hostId = player.hostId; // Obtiene el id del anfitrión del juego.
                var game = games.getGame(hostId); // Obtiene datos del juego con hostId
                var pin = game.pin; // Obtiene el pin del juego

                if (game.gameLive == false) { // Si el juego no esta iniciado todavia
                    players.removePlayer(socket.id); // Elimina al jugador de la clase de jugadores.
                    var playersInGame = players.getPlayers(hostId); // Obtiene los jugadores restantes en el juego

                    io.to(pin).emit('updatePlayerLobby', playersInGame);
                    socket.leave(pin); // El jugador abandona la sala
                } else { // Si el juego ya ha comenzado
                    //io.to(player.hostId).emit('gameEnded', { reason: 'playerDisconnected', player: player });
                    // Pendiente
                }
            }
        }
    });

    // Establece datos en la clase de jugador para responder desde el jugador
    socket.on('playerAnswer', async function (num) {
        try {
            const player = players.getPlayer(socket.id);
            const hostId = player.hostId;
            const playerNum = players.getPlayers(hostId);
            const game = games.getGame(hostId);

            if (game.gameData.questionLive == true) {
                player.gameData.answer = num;
                game.gameData.playersAnswered += 1;

                const gameQuestion = game.gameData.question;
                const gameid = game.gameData.gameid;

                await mongoose.connect('mongodb://127.0.0.1:27017/FootballQuizDB');

                const quizGame = await QuizGame.findOne({ id: parseInt(gameid) }).exec();

                if (quizGame) {
                    const correctAnswer = quizGame.questions[gameQuestion - 1].correct;

                    // Comprueba la respuesta del jugador con la respuesta correcta.
                    if (num == correctAnswer) {
                        player.gameData.score += 100;
                        io.to(game.pin).emit('getTime', socket.id);
                        socket.emit('answerResult', true);
                    }

                    // Comprueba si todos los jugadores respondieron
                    if (game.gameData.playersAnswered == playerNum.length) {
                        game.gameData.questionLive = false;
                        // La pregunta finalizó porque todos los jugadores respondieron antes del tiempo
                        const playerData = players.getPlayers(game.hostId);
                        io.to(game.pin).emit('questionOver', playerData, correctAnswer);
                    } else {
                        // Actualiza la pantalla del anfitrión del número de jugadores respondidos
                        io.to(game.pin).emit('updatePlayersAnswered', {
                            playersInGame: playerNum.length,
                            playersAnswered: game.gameData.playersAnswered
                        });
                    }
                }

                mongoose.connection.close();
            }
        } catch (err) {
            console.error(err);
        }
    });


    socket.on('getScore', function () {
        var player = players.getPlayer(socket.id);
        socket.emit('newScore', player.gameData.score);
    });


    socket.on('time', function (data) {
        var time = data.time / 20;
        time = time * 100;
        var playerid = data.player;
        var player = players.getPlayer(playerid);
        player.gameData.score += time;
    });


    socket.on('timeUp', async function () {
        try {
            const game = games.getGame(socket.id);
            game.gameData.questionLive = false;
            const playerData = players.getPlayers(game.hostId);

            const gameQuestion = game.gameData.question;
            const gameid = game.gameData.gameid;

            await mongoose.connect('mongodb://127.0.0.1:27017/FootballQuizDB');

            const quizGame = await QuizGame.findOne({ id: parseInt(gameid) }).exec();

            if (quizGame) {
                const correctAnswer = quizGame.questions[gameQuestion - 1].correct;
                io.to(game.pin).emit('questionOver', playerData, correctAnswer);
            }

            mongoose.connection.close();
        } catch (err) {
            console.error(err);
        }
    });


    socket.on('nextQuestion', async function () {
        try {
            const playerData = players.getPlayers(socket.id);

            // Reset players current answer to 0
            for (let i = 0; i < Object.keys(players.players).length; i++) {
                if (players.players[i].hostId == socket.id) {
                    players.players[i].gameData.answer = 0;
                }
            }

            const game = games.getGame(socket.id);
            game.gameData.playersAnswered = 0;
            game.gameData.questionLive = true;
            game.gameData.question += 1;
            const gameid = game.gameData.gameid;

            await mongoose.connect('mongodb://127.0.0.1:27017/FootballQuizDB');

            const quizGame = await QuizGame.findOne({ id: parseInt(gameid) }).exec();

            if (quizGame && quizGame.questions.length >= game.gameData.question) {
                const questionNum = game.gameData.question - 1;
                const question = quizGame.questions[questionNum].question;
                const answer1 = quizGame.questions[questionNum].answers[0];
                const answer2 = quizGame.questions[questionNum].answers[1];
                const answer3 = quizGame.questions[questionNum].answers[2];
                const answer4 = quizGame.questions[questionNum].answers[3];
                const correctAnswer = quizGame.questions[questionNum].correct;
                const length = quizGame.questions.length;

                socket.emit('gameQuestions', {
                    questionNum: questionNum + 1,
                    length: length,
                    q1: question,
                    a1: answer1,
                    a2: answer2,
                    a3: answer3,
                    a4: answer4,
                    correct: correctAnswer,
                    playersInGame: playerData.length
                });

                io.to(game.pin).emit('getQuestion', {
                    questionNum: questionNum + 1,
                    length: length,
                    q1: question,
                    a1: answer1,
                    a2: answer2,
                    a3: answer3,
                    a4: answer4,
                });

                io.to(game.pin).emit('nextQuestionPlayer');
            } else {
                const playersInGame = players.getPlayers(game.hostId);
                const ranking = getRanking(playersInGame);
                io.to(game.pin).emit('GameOver', ranking);
            }

            mongoose.connection.close();

        } catch (err) {
            console.error(err);
        }
    });

    function getRanking(players) {
        const sortedPlayers = players.sort((a, b) => b.gameData.score - a.gameData.score);
        return {
            num1: {
                name: sortedPlayers[0]?.name || '',
                score: sortedPlayers[0]?.gameData.score || 0,
                team: sortedPlayers[0]?.teamId || 0,
            },
            num2: {
                name: sortedPlayers[1]?.name || '',
                score: sortedPlayers[1]?.gameData.score || 0,
                team: sortedPlayers[1]?.teamId || 0,
            },
            num3: {
                name: sortedPlayers[2]?.name || '',
                score: sortedPlayers[2]?.gameData.score || 0,
                team: sortedPlayers[2]?.teamId || 0,
            },
            num4: {
                name: sortedPlayers[3]?.name || '',
                score: sortedPlayers[3]?.gameData.score || 0,
                team: sortedPlayers[3]?.teamId || 0,
            },
            num5: {
                name: sortedPlayers[4]?.name || '',
                score: sortedPlayers[4]?.gameData.score || 0,
                team: sortedPlayers[4]?.teamId || 0,
            },
        };
    }

    // Cuando el anfitrión comienza el juego
    socket.on('startGame', () => {
        var game = games.getGame(socket.id); // Obtiene el juego basado en socket.id
        game.gameLive = true;
        socket.emit('gameStarted', game.hostId); //Dice al jugador y al anfitrión que el juego ha comenzado
    });

    // Give user game names data
    socket.on('requestDbNames', async function () {
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/FootballQuizDB');

            const quizGames = await QuizGame.find().exec();

            socket.emit('gameNamesData', quizGames);
        } catch (err) {
            console.error(err);
        } finally {
            mongoose.connection.close();
        }
    });


    socket.on('newQuiz', async function (data) {
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/FootballQuizDB');

            const existingQuiz = await QuizGame.findOne({ id: data.id }).exec();

            if (!existingQuiz) {
                // Si el cuestionario con el ID proporcionado no existe, crea uno nuevo
                const newQuiz = new QuizGame(data);
                await newQuiz.save();
                socket.emit('startGameFromCreator', newQuiz.id);
            } else {
                // Si el cuestionario con el ID proporcionado ya existe, actualícelo
                existingQuiz.name = data.name;
                existingQuiz.questions = data.questions;
                await existingQuiz.save();
                socket.emit('startGameFromCreator', existingQuiz.id);
            }
            mongoose.connection.close();
        } catch (err) {
            console.error(err);
            mongoose.connection.close();
        }
    });
});
