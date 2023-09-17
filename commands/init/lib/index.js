'use strict';

const Command = require("@fish-cli-dev/command")
const log = require('@fish-cli-dev/log')

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = this._cmd.force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    exec() {
        console.log('exec')
    }
}
function init(argv) {
    // console.log('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH)
    return new InitCommand(argv)

}

module.exports.InitCommand = InitCommand
module.exports = init