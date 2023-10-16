const GitServer = require("./GitServer");

class Gitee extends GitServer {
    constructor() {
        super('gitee')
    }
}

module.exports = Gitee