var socket = io();
var params = jQuery.deparam(window.location.search);

//Cuando el host se conecta al servidor
socket.on('connect', function() {
    // Limpiar la lista de jugadores cuando el host se conecta
    var playersList = document.getElementById('playersList');
    playersList.innerHTML = '';

    // Dice al servidor que es una conexión de host
    socket.emit('host-join', params);
});

socket.on('showGamePin', function(data){
   document.getElementById('gamePinText').innerHTML = data.pin;
});

//Agrega el nombre del jugador a la pantalla y actualiza el recuento de jugadores
socket.on('updatePlayerLobby', function(data) {
    var playersList = document.getElementById('playersList');
    
    // Limpiar la lista antes de actualizarla
    playersList.innerHTML = '';

    for (var i = 0; i < data.length; i++) {
        var listItem = document.createElement('li');

        listItem.innerHTML = '<span class="player-name">' + data[i].name + '</span>';

        playersList.appendChild(listItem);
    }
});

//Dice al servidor que inicie el juego si se hace clic en el botón
function startGame(){
    socket.emit('startGame');
}
function endGame(){
    window.location.href = "/";
}

//Cuando el servidor inicia el juego
socket.on('gameStarted', function(id){
    console.log('Game Started!');
    window.location.href="/views/host/game/" + "?id=" + id;
});

socket.on('noGameFound', function(){
   window.location.href = '../../../';// Redirigir al usuario a la página de 'unirse al juego'
});

