var socket = io();
var playerAnswered = false;
var correct = false;
var name;
var score = 0;
var timer;
var time = 20;

var params = jQuery.deparam(window.location.search); //Obtiene la identificación de la URL

socket.on('connect', function () {
    //Dice al servidor que es una conexión de host desde la vista del juego
    socket.emit('player-join-game', params);

    document.getElementById('answer1').style.visibility = "visible";
    document.getElementById('answer2').style.visibility = "visible";
    document.getElementById('answer3').style.visibility = "visible";
    document.getElementById('answer4').style.visibility = "visible";
    updateTimer();
});

socket.on('getQuestion', function (data) {
    document.getElementById('question').innerHTML = data.q1;
    document.getElementById('answer1').innerHTML = "A) "+data.a1;
    document.getElementById('answer2').innerHTML = "B) "+data.a2;
    document.getElementById('answer3').innerHTML = "C) "+data.a3;
    document.getElementById('answer4').innerHTML = "D) "+data.a4;
    document.getElementById('num').innerHTML = "20";
    time = 20;
});

socket.on('noGameFound', function () {
    window.location.href = '../../../'; //Redirigir al usuario a la página de 'unirse al juego'
});

function answerSubmitted(num) {
    if (playerAnswered == false) {
        playerAnswered = true;

        socket.emit('playerAnswer', num); //Envía la respuesta del jugador al servidor

        //Hiding buttons from user
        document.getElementById('question').style.visibility = "hidden";
        document.getElementById('answer1').style.visibility = "hidden";
        document.getElementById('answer2').style.visibility = "hidden";
        document.getElementById('answer3').style.visibility = "hidden";
        document.getElementById('answer4').style.visibility = "hidden";
        document.getElementById('timer').style.visibility = "hidden";
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "¡Respuesta enviada! Esperando a otros jugadores...";

    }
}

//Obtiene resultados de la última pregunta
socket.on('answerResult', function (data) {
    if (data == true) {
        correct = true;
    }
});

socket.on('questionOver', function (data) {
    if (correct == true) {
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Correcto! <br><br><img src='/media/25450.png' alt='Correcto'>";
    } else {
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Incorrecto! <br><br><img src='/media/25451.png' alt='Incorrecto'>";
    }
    document.getElementById('question').style.visibility = "hidden";
    document.getElementById('answer1').style.visibility = "hidden";
    document.getElementById('answer2').style.visibility = "hidden";
    document.getElementById('answer3').style.visibility = "hidden";
    document.getElementById('answer4').style.visibility = "hidden";
    document.getElementById('timer').style.visibility = "hidden";
    socket.emit('getScore');
});

socket.on('newScore', function (data) {
    document.getElementById('scoreText').innerHTML = "Puntuación: " + data;
});

socket.on('nextQuestionPlayer', function () {
    correct = false;
    playerAnswered = false;

    document.getElementById('question').style.visibility = "visible";
    document.getElementById('answer1').style.visibility = "visible";
    document.getElementById('answer2').style.visibility = "visible";
    document.getElementById('answer3').style.visibility = "visible";
    document.getElementById('answer4').style.visibility = "visible";
    document.getElementById('timer').style.visibility = "visible";
    document.getElementById('message').style.display = "none";
});

socket.on('hostDisconnect', function () {
    window.location.href = "../../../";
});

// Manejar el evento de finalización del juego
socket.on('gameEnded', function (data) {
    if (data.reason === 'hostDisconnected') {
        alert('La partida ha finalizado debido a la desconexión del anfitrión. Volviendo a la página de inicio.');
        window.location.href = "../../../";
    }
});

socket.on('playerGameData', function (data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].playerId == socket.id) {
            document.getElementById('nameText').innerHTML = data[i].name;
            document.getElementById('scoreText').innerHTML = "Puntuación: " + data[i].gameData.score;
            if (data[i].teamId !== null) {
                document.getElementById('teamImg').src = "/media/teams/"+data[i].teamId+".png";
            }
        }
    }
});

socket.on('GameOver', function (data) {
    document.getElementById('question').style.display = "none";
    document.getElementById('answer1').style.display = "none";
    document.getElementById('answer2').style.display = "none";
    document.getElementById('answer3').style.display = "none";
    document.getElementById('answer4').style.display = "none";
    document.getElementById('timer').style.display = "none";
    document.getElementById('question').style.display = "none";
    document.getElementById('message').innerHTML = "Partida Terminada";
    document.getElementById('message').style.display = "block";
    document.getElementById('message').style.marginTop = "30px";

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

function updateTimer() {
    time = 20;
    timer = setInterval(function () {
        time -= 1;
        document.getElementById('num').textContent = " " + time;
        if (time == 0) {
            document.getElementById('timer').style.visibility = "hidden";
        }
    }, 1000);
}