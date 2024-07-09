var socket = io();

// Cuando el jugador se conecta al servidor
socket.on('connect', function () {

    var params = jQuery.deparam(window.location.search); //Obtiene datos de la URL

    //Dice al servidor que es una conexión de jugador
    socket.emit('player-join', params);

    socket.emit('request-teams');
});

//Inicia el reproductor nuevamente para unirse a la pantalla si el pin del juego no coincide
socket.on('noGameFound', function () {
    window.location.href = '../../';
});

//Si el host se desconecta, el reproductor se inicia en la pantalla principal
socket.on('hostDisconnect', function () {
    window.location.href = '../../';
});

//Cuando el anfitrión hace clic en iniciar juego, la pantalla del jugador cambia
socket.on('gameStartedPlayer', function () {
    window.location.href = "/views/player/game/" + "?id=" + socket.id;
});

socket.on('teamsData', (data) => {
    const teams = data.teamsData;
    const teamImagesContainer = document.getElementById('team');
    let selectedTeamId = null;

    teamImagesContainer.innerHTML = '';
    const availableTeams = teams.filter(team => !team.used && team.hostId === data.player.hostId);

    // Llenar dinámicamente el contenedor de imágenes con los equipos obtenidos
    availableTeams.forEach(team => {
        const teamImage = document.createElement('img');
        teamImage.src = "/media/teams/" + team.img;
        teamImage.alt = team.name;
        teamImage.setAttribute('data-team', team.id);
        teamImage.classList.add('team-image');

        teamImage.style.width = '100px';
        teamImage.style.height = 'auto';
        teamImage.style.marginRight = '10px';

        teamImage.addEventListener('click', function () {
            handleTeamSelection(team.id);
        });

        // Aplicar el estilo de selección si es el equipo seleccionado
        if (team.id === selectedTeamId) {
            teamImage.classList.add('selected-team');
        }

        teamImagesContainer.appendChild(teamImage);
    });

    function handleTeamSelection(teamId) {
        document.querySelectorAll('.team-image').forEach(img => {
            img.classList.remove('selected-team');
        });

        const selectedTeamImage = document.querySelector(`.team-image[data-team="${teamId}"]`);
        if (selectedTeamImage) {
            selectedTeamImage.classList.add('selected-team');
        }
        selectedTeamId = teamId;
    }

    document.getElementById('selectTeam').addEventListener('click', function () {
        const selectedTeamId = getSelectedTeamId();
        const playerId = data.player.playerId;

        if (!selectedTeamId) {
            alert('Por favor, selecciona un equipo antes de continuar.');
            return;
        }

        // Oculta el botón 'Seleccionar'
        document.getElementById('selectTeam').style.display = 'none';

        const selectedTeam = teams.find(team => team.id === selectedTeamId);

        document.getElementById('label').innerText = selectedTeam.name;

        // Emitir evento al servidor para establecer el equipo
        socket.emit('set-team', { playerId, selectedTeamId });

        const teamContainer = document.getElementById('team');
        teamContainer.style.display = 'none';

        // Crea un nuevo div para la imagen del equipo seleccionado
        const selectedTeamDiv = document.createElement('div');
        selectedTeamDiv.id = 'selectedTeamDiv';

        // Muestra la foto del equipo seleccionado en el nuevo div
        const teamImage = document.createElement('img');
        teamImage.src = "/media/teams/" + selectedTeam.img;
        teamImage.alt = selectedTeam.name;
        teamImage.style.width = '200px'; // Ajusta el tamaño a tu preferencia
        teamImage.style.height = 'auto';

        // Agrega la nueva imagen al nuevo div
        selectedTeamDiv.appendChild(teamImage);

        // Agrega el nuevo div al cuerpo del documento (o al contenedor deseado)
        document.body.appendChild(selectedTeamDiv);
    });

    function getSelectedTeamId() {
        return selectedTeamId;
    }

    socket.on('update-teams', (updatedTeamsData) => {
        selectedTeamId = null;
        const teamImagesContainer = document.getElementById('team');

        teamImagesContainer.innerHTML = '';
        const availableTeams = updatedTeamsData.filter(team => !team.used);

        availableTeams.forEach(team => {
            const teamImage = document.createElement('img');
            teamImage.src = "/media/teams/" + team.img;
            teamImage.alt = team.name;
            teamImage.setAttribute('data-team', team.id);
            teamImage.classList.add('team-image');

            teamImage.style.width = '100px';
            teamImage.style.height = 'auto';
            teamImage.style.marginRight = '10px';

            teamImage.addEventListener('click', function () {
                handleTeamSelection(team.id);
            });

            // Aplicar el estilo de selección si es el equipo seleccionado
            if (team.id === selectedTeamId) {
                teamImage.classList.add('selected-team');
            }

            teamImagesContainer.appendChild(teamImage);
        });
    });
});
