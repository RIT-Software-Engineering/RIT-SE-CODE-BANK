class User {
    constructor(name){
        this.name = name
    }
}
class Manager {
    constructor(){
        this.metaData = null
        this.classes = []
        this.teamCreationAlgo = null
    }
}
class Class {
    constructor(){
        this.teams = []
        this.users = []
    }
    createTeam(size){
        //implement
    }
}
class Team {
    constructor(maxSize){
        this.users = []
        this.maxSize = maxSize
        this.metaData = null
    }
    addUser(user){
        this.users.push(user)
    }
    removeUser(user){
        this.users.find(user)
    }
}



class createTeamAlgo {
    createTeams(clasS,size){

    }
}
class Manuel extends createTeamAlgo {
    createTeams(clasS,size){
        //implement
    }
}