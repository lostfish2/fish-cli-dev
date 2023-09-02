'use strict';

module.exports = core;

const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExisits = require('path-exists').sync
const log = require('@fish-cli-dev/log')

const constant = require('./const')
const pkg = require('../package.json')

let args
async function core() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    checkEnv()
    await checkGlobalUpdate()
  } catch (e) {
    log.error(e.message)
  }
}

async function checkGlobalUpdate() {
  //1、获取当前版本号和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  //2\调用npm API 获取所有版本号
  const { getNpmVersions, getNpmSemverVersion } = require("@fish-cli-dev/get-npm-info")
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(colors.yellow(`请手动更新${npmName},当前版本：${currentVersion},最新版本：${lastVersion}
    更新命令:npm install -g ${npmName}`))
  }
  //3、提取所有版本号，比对哪些版本号是大于当前版本号
  //4、获取最新的版本号，提示用户更新到该版本
}
function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExisits(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    })
  } else {

  }
  createDefaultConfig()
  log.verbose('环境变量', process.env.CLI_HOME_PATH)
}
function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
  return cliConfig
}
function checkInputArgs() {
  const minimist = require('minimist')
  args = minimist(process.argv.slice(2))
  checkArgs()
}
function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}
function checkUserHome() {
  if (!userHome || !pathExisits(userHome)) {
    throw new Error(colors.red('用户主目录不存在'))
  }
}
//检查root，进行降级
function checkRoot() {
  const rootCheck = require('root-check')
  rootCheck()
}

//检查node版本号 h
function checkNodeVersion() {
  const currentVersion = process.version
  const lowestVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`fish-cli 需要安装v${lowestVersion}以上版本的node.js`))
  }
}

//检查当前版本号
function checkPkgVersion() {
  log.success('cli', pkg.version)
}
