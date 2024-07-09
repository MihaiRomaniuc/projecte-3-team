class Teams {
    constructor() {
        this.teams = [];
    }

    addTeam(id, name, img, hostId, used = false) {
        var team = { id, name, img, hostId, used };
        this.teams.push(team);
        return team;
    }

    removeTeam(id) {
        var team = this.getTeam(id);

        if (team) {
            this.teams = this.teams.filter((team) => team.id !== id);
        }

        return team;
    }

    getTeam(id) {
        return this.teams.find((team) => team.id === id);
    }

    getAllTeams() {
        return this.teams;
    }

    markTeamAsUsed(id) {
        var team = this.getTeam(id);

        if (team) {
            team.used = true;
        }

        return team;
    }
}

module.exports = { Teams };