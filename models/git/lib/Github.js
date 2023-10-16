const GitServer = require("./GitServer");

class Github extends GitServer {
    constructor() {
        super('github')
    }
}

module.exports = Github