'use strict';
const Package = require('@fish-cli-dev/package')
const log = require('@fish-cli-dev/log')
const path = require('path')
const cp = require('child_process')
const SETTINGS = {
  init: 'pkg-dir'
}
const CACHE_DIR = 'dependencies'

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  let storeDir = ''
  let pkg = {}
  const cmdObj = arguments[arguments.length - 1]
  const cmdName = cmdObj.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = 'latest'

  if (!targetPath) {
    targetPath = path.resolve(homePath, 'dependencies') //生成缓存路径
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storeDir', storeDir)

    pkg = new Package({
      targetPath,
      packageName,
      storeDir,
      packageVersion
    })

    if (await pkg.exists()) {
      //更新package
      await pkg.update()
    } else {
      //安装package
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    })
  }
  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    try {
      //在当前进程中调用
      // require(rootFile).call(null, Array.from(arguments))
      //在子进程中调用
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      const o = Object.create(null)
      //cmd自己的属性，不以'-'开头，不是parent的属性
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) &&
          !key.startsWith('-') &&
          key != 'parent') {
          o[key] = cmd[key]
        }
      })
      args[args.length - 1] = o
      const code = `require(${rootFile}).call(null, ${JSON.stringify(args)})`
      cp.spawn('cmd', ['/c', 'node', '-e', code])
      const child = spawn('node', ['-V', code], {
        cwd: process.cwd(),
        stdio: 'inherit'
      })
      child.on('error', e => {
        log.error(e.message)
        process.exit(1)
      })
      child.on('exit', e => {
        log.verbose('命令执行成功:', +e)
        process.exit(e)
      })
    } catch (e) {
      log.error(e.message)
    }
  }
}
//win兼容处理
function spawn(command, args, options) {
  const win32 = process.platform === 'win32'

  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args
  return cp.spawn(cmd, cmdArgs, options || {})
}
module.exports = exec;