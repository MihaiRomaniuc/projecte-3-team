var socket = io();

var params = jQuery.deparam(window.location.search); //Obtiene la identificación de la URL

var timer;

var time = 20;

//Cuando el host se conecta al servidor
socket.on('connect', function () {

    //Dice al servidor que es una conexión de host desde la vista del juego
    socket.emit('host-join-game', params);
});

socket.on('noGameFound', function () {
    window.location.href = '../../../'; //Redirigir al usuario a la página de 'unirse al juego'
});

socket.on('gameQuestions', function (data) {
    document.getElementById('question').innerHTML = data.q1;
    document.getElementById('answer1').innerHTML = "A) "+data.a1;
    document.getElementById('answer2').innerHTML = "B) "+data.a2;
    document.getElementById('answer3').innerHTML = "C) "+data.a3;
    document.getElementById('answer4').innerHTML = "D) "+data.a4;
    var correctAnswer = data.correct;
    document.getElementById('questionNum').innerHTML = "Pregunta " + data.questionNum + " / " + data.length;
    document.getElementById('playersAnswered').innerHTML = "Jugadores que han contestado 0 / " + data.playersInGame;
    updateTimer();
});

socket.on('updatePlayersAnswered', function (data) {
    document.getElementById('playersAnswered').innerHTML = "Jugadores que han contestado " + data.playersAnswered + " / " + data.playersInGame;
});

// Manejar el evento de finalización del juego
socket.on('gameEnded', function (data) {
    if (data.reason === 'playerDisconnected') {
        alert(data.player.name + ' se ha desconectado');
    }
});

socket.on('questionOver', function (playerData, correct) {
    clearInterval(timer);
    var answer1 = 0;
    var answer2 = 0;
    var answer3 = 0;
    var answer4 = 0;
    var total = 0;
    //Oculta elementos en la página
    document.getElementById('playersAnswered').style.display = "none";
    document.getElementById('timerText').style.display = "none";

    //Muestra la respuesta correcta del usuario con efectos en los elementos
    if (correct == 1) {
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        var current = document.getElementById('answer1').innerHTML;
        document.getElementById('answer1').innerHTML = "&#10004" + " " + current;
    } else if (correct == 2) {
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        var current = document.getElementById('answer2').innerHTML;
        document.getElementById('answer2').innerHTML = "&#10004" + " " + current;
    } else if (correct == 3) {
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        var current = document.getElementById('answer3').innerHTML;
        document.getElementById('answer3').innerHTML = "&#10004" + " " + current;
    } else if (correct == 4) {
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        var current = document.getElementById('answer4').innerHTML;
        document.getElementById('answer4').innerHTML = "&#10004" + " " + current;
    }

    for (var i = 0; i < playerData.length; i++) {
        if (playerData[i].gameData.answer == 1) {
            answer1 += 1;
        } else if (playerData[i].gameData.answer == 2) {
            answer2 += 1;
        } else if (playerData[i].gameData.answer == 3) {
            answer3 += 1;
        } else if (playerData[i].gameData.answer == 4) {
            answer4 += 1;
        }
        total += 1;
    }

    //Obtiene valores para el gráfico
    answer1 = answer1 / total * 100;
    answer2 = answer2 / total * 100;
    answer3 = answer3 / total * 100;
    answer4 = answer4 / total * 100;

    document.getElementById('square1').style.display = "flex";
    document.getElementById('square2').style.display = "flex";
    document.getElementById('square3').style.display = "flex";
    document.getElementById('square4').style.display = "flex";

    document.getElementById('square1').innerHTML = "A";
    document.getElementById('square2').innerHTML = "B";
    document.getElementById('square3').innerHTML = "C";
    document.getElementById('square4').innerHTML = "A";

    document.getElementById('square1').style.height = answer1 + "px";
    document.getElementById('square2').style.height = answer2 + "px";
    document.getElementById('square3').style.height = answer3 + "px";
    document.getElementById('square4').style.height = answer4 + "px";

    document.getElementById('nextQButton').style.display = "block";

});

function nextQuestion() {
    document.getElementById('nextQButton').style.display = "none";
    document.getElementById('square1').style.display = "none";
    document.getElementById('square2').style.display = "none";
    document.getElementById('square3').style.display = "none";
    document.getElementById('square4').style.display = "none";

    document.getElementById('answer1').style.filter = "none";
    document.getElementById('answer2').style.filter = "none";
    document.getElementById('answer3').style.filter = "none";
    document.getElementById('answer4').style.filter = "none";

    document.getElementById('answer1').style.innerHTML = "";
    document.getElementById('answer2').style.innerHTML = "";
    document.getElementById('answer3').style.innerHTML = "";
    document.getElementById('answer4').style.innerHTML = "";

    document.getElementById('playersAnswered').style.display = "block";
    document.getElementById('timerText').style.display = "block";
    document.getElementById('num').innerHTML = " 20";
    socket.emit('nextQuestion'); //Dice al servidor que inicie una nueva pregunta
}

function updateTimer() {
    time = 20;
    timer = setInterval(function () {
        time -= 1;
        document.getElementById('num').textContent = " " + time;
        if (time == 0) {
            socket.emit('timeUp');
        }
    }, 1000);
}

socket.on('GameOver', function (data) {
    document.getElementById('nextQButton').style.display = "none";
    document.getElementById('square1').style.display = "none";
    document.getElementById('square2').style.display = "none";
    document.getElementById('square3').style.display = "none";
    document.getElementById('square4').style.display = "none";

    document.getElementById('answer1').style.display = "none";
    document.getElementById('answer2').style.display = "none";
    document.getElementById('answer3').style.display = "none";
    document.getElementById('answer4').style.display = "none";
    document.getElementById('timerText').innerHTML = "";
    document.getElementById('question').innerHTML = "Partida Terminada";
    document.getElementById('playersAnswered').innerHTML = "";



    document.getElementById('winner1').style.display = "block";
    document.getElementById('winner2').style.display = "block";
    document.getElementById('winner3').style.display = "block";
    document.getElementById('winner4').style.display = "block";
    document.getElementById('winner5').style.display = "block";
    document.getElementById('winnerTitle').style.display = "block";

    if (data.num1 && data.num1.name) {
        document.getElementById('winner1').innerHTML = "1. " + '<img src="/media/teams/' + data.num1.team + '.png" class="teamImage" />' + data.num1.name + " - " + data.num1.score;
    }

    if (data.num2 && data.num2.name) {
        document.getElementById('winner2').innerHTML = "2. " + '<img src="/media/teams/' + data.num2.team + '.png" class="teamImage" />' + data.num2.name + " - " + data.num2.score;
    }

    if (data.num3 && data.num3.name) {
        document.getElementById('winner3').innerHTML = "3. " + '<img src="/media/teams/' + data.num3.team + '.png" class="teamImage" />' + data.num3.name + " - " + data.num3.score;
    }

    if (data.num4 && data.num4.name) {
        document.getElementById('winner4').innerHTML = "4. " + '<img src="/media/teams/' + data.num4.team + '.png" class="teamImage" />' + data.num4.name + " - " + data.num4.score;
    }

    if (data.num5 && data.num5.name) {
        document.getElementById('winner5').innerHTML = "5. " + '<img src="/media/teams/' + data.num5.team + '.png" class="teamImage" />' + data.num5.name + " - " + data.num5.score;
    }
});


socket.on('getTime', function (player) {
    socket.emit('time', {
        player: player,
        time: time
    });
});




















