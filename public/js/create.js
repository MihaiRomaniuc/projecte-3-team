var socket = io();

socket.on('connect', function(){
    socket.emit('requestDbNames');// Obtener nombres de bases de datos para mostrar al usuario
});

socket.on('gameNamesData', function(data){
    for(var i = 0; i < Object.keys(data).length; i++){
        var div = document.getElementById('game-list');
        var button = document.createElement('button');
        
        button.innerHTML = data[i].name;
        button.setAttribute('onClick', "startGame('" + data[i].id + "')");
        button.setAttribute('id', 'gameButton');
        button.style.backgroundImage = "url('/media/"+data[i].name+".png')";
        
        div.appendChild(button);
        div.appendChild(document.createElement('br'));
        div.appendChild(document.createElement('br'));
    }
});

function startGame(data){
    window.location.href="/views/host/" + "?id=" + data;
}
