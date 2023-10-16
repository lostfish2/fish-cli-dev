'use strict';

const fs = require('fs')
const path = require('path')
const SimpleGit = require('simple-git')
const userHome = require('user-home')
const log = require('@fish-cli-dev/log')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const { readFile, writeFile } = require('@fish-cli-dev/utils')
const Github = require('./Github')
const Gitee = require('./Gitee')

const DEFAULT_CLI_HOME = '.fish-cli-dev'
const GIT_SERVER_FILE = '.git_server'
const GIT_TOKEN_FILE = '.git_token'
const Git_ROOT_DIR = '.git'
const GITHUB = 'github'
const GITEE = 'gitee'

const GIT_SERVER_TYPE = [{
  name: 'Github',
  value: GITHUB
}, {
  name: 'Gitee',
  value: GITEE
}]

class Git {
  constructor({ name, version, dir }, { refreshServer = false }) {
    this.name = name
    this.version = version
    this.dir = dir
    this.git = SimpleGit(dir)
    this.gitServer = null
    this.homePath = null
    this.refreshServer = refreshServer
  }
  async prepare() {
    //检查缓存主目录
    this.checkHomePath()
    //检查用户远程仓库类型
    await this.checkGitServer()
    //获取远程仓库token
    await this.checkGitToken()
  }
  checkHomePath() {
    if (!this.homePath) {
      if (process.env.CLI_HOME_PATH) {
        this.homePath = process.env.CLI_HOME_PATH
      } else {
        this.homePath = path.resolve(userHome, DEFAULT_CLI_HOME)
      }
    }
    log.verbose('home', this.homePath)
    fse.ensureDirSync(this.homePath)
    if (!fs.existsSync(this.homePath)) {
      throw new Error('用户主目录获取失败！')
    }
  }
  async checkGitServer() {
    const gitServerPath = this.createPath(GIT_SERVER_FILE)
    let gitServer = readFile(gitServerPath)
    if (!gitServer || this.refreshServer) {
      gitServer = (await inquirer.prompt({
        type: 'list',
        name: 'gitServer',
        message: '请选择您想要托管的Git平台',
        default: GITHUB,
        choices: GIT_SERVER_TYPE
      })).gitServer;
      writeFile(gitServerPath, gitServer)
      log.success('git server写入成功', `${gitServer}-->${gitServerPath}`)
    } else {
      log.success('git server获取成功', gitServer)
    }
    this.gitServer = this.createGitServer(gitServer)
    if (!this.gitServer) {
      throw new Error('GitServer初始化失败')
    }
  }
  createGitServer(gitServer = '') {
    if (_gitServer === GITHUB) {
      return new Github()
    } else if (gitServer === GITEE) {
      return new Gitee()
    }
    return null
  }
  async checkGitToken() {
    const tokenPath = this.createPath(GIT_TOKEN_FILE)
    let token = readFile(tokenPath)
    if (!token) {
      log.warn(this.gitServer.type + 'token未生成！')
    }
  }
  createPath(file) {
    const rootDir = path.resolve(this.homePath, Git_ROOT_DIR)
    const filePath = path.resolve(rootDir, file)
    fse.ensureDirSync(rootDir)
    return filePath
  }
}


module.exports = Git;

