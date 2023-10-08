'use strict';

const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const glob = require('glob')
const ejs = require('ejs')
const semver = require('semver')
const userHome = require('user-home')
const Command = require("@fish-cli-dev/command")
const Package = require('@fish-cli-dev/package')
const log = require('@fish-cli-dev/log')
const { spinnerStart, sleep, execAsync } = require('@fish-cli-dev/utils')

const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

const WHITE_COMMAND = ['npm', 'cnpm']
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = this._cmd.force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    async exec() {
        try {
            //1、准备阶段
            const projectInfo = await this.prepare()
            if (projectInfo) {
                //2、下载模板
                this.projectInfo = projectInfo
                log.verbose('projectInfo', projectInfo)
                await this.downloadTemplate()
                //3、安装模板
                await this.installTemplate()
            }

        } catch (e) {
            log.error(e.message)
        }

    }
    async installTemplate() {
        if (this.templateInfo && this.templateInfo.type) {
            if (!this.templateInfo.type) {
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL
            }
            if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                //标准安装
                await this.installNormalTemplate()
            } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                //自定义安装
                await this.installCustomTemplate()
            } else {
                throw new Error('无法识别项目模板类型！')
            }
        } else {
            throw new Error('项目模板信息不存在')
        }
    }
    checkCommand(cmd) {
        if (WHITE_COMMAND.includes(cmd)) {
            return cmd
        }
        return null
    }
    async execCommand(command, errMsg) {
        let ret
        if (command) {
            const cmdArray = command.split(' ')
            const cmd = this.checkCommand(cmdArray[0])
            if (!cmd) {
                throw new Error('命令不存在！命令：' + command)
            }
            const args = cmdArray.slice(1)
            ret = await execAsync(cmd, args, {
                stdio: 'inherit',
                cwd: process.cwd()
            })
        }
        if (ret !== 0) {
            throw new Error(errMsg)
        }
    }

    ejsRender(options) {
        const dir = process.cwd()
        return new Promise((resolve, reject) => {
            glob('**', {
                cwd: dir,
                ignore: options.ignore || '',
                nodir: true
            }, (err, files) => {
                if (err) {
                    reject(err)
                }
                Promise.all(files.map(file => {
                    const filePath = path.join(dir, file)
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, this.projectInfo, {}, (err, result) => {
                            // console.log(err, result)
                            if (err) {
                                reject1(err)
                            } else {
                                fse.writeFileSync(filePath, result)
                                resolve1(result)
                            }
                        })
                    })
                })).then(() => {
                    resolve()
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }

    async installNormalTemplate() {
        log.verbose('templateNpm', this.templateNpm)
        //拷贝代码至当前目录
        let spinner = spinnerStart('正在安装模板...')
        await sleep()
        try {
            const templatePath = this.templateNpm.whichSys ? path.resolve(this.templateNpm.cacheFilePath, 'template') :
                path.resolve(this.templateNpm.cacheFilePathWin, `node_modules\\${this.templateInfo.npmName}\\template`)
            const targetPath = process.cwd()
            fse.ensureDirSync(templatePath)
            fse.ensureDirSync(targetPath)
            fse.copySync(templatePath, targetPath)
        } catch (e) {
            throw e
        } finally {
            spinner.stop(true)
            log.success('模板安装成功')
        }
        const ignore = ['node_modules/**', 'public/**']
        await this.ejsRender({ ignore })
        //依赖安装
        const { installCommand, startCommand } = this.templateInfo
        await this.execCommand(installCommand, '依赖安装失败！')
        //启动命令执行
        await this.execCommand(startCommand, '启动执行命令失败！')
    }
    async installCustomTemplate() {
        console.log('安装自定义模板')
    }
    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo
        const templateInfo = this.template.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome, 'fish-cli-dev', 'template')
        const storeDir = path.resolve(userHome, 'fish-cli-dev', 'template', 'node_modules')
        const { npmName, version } = templateInfo
        this.templateInfo = templateInfo
        const templateNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version
        })
        if (!await templateNpm.exists()) {
            const spinner = spinnerStart('正在下载模板')
            await sleep()
            try {
                await templateNpm.install()
            } catch (e) {
                throw e
            } finally {
                spinner.stop(true)
                if (await templateNpm.exists()) {
                    log.success('下载模板成功')
                    this.templateNpm = templateNpm
                }
            }
        } else {
            const spinner = spinnerStart('正在更新模板')
            await sleep()
            try {
                await templateNpm.update()
            } catch (e) {
                throw e
            } finally {
                spinner.stop(true)
                if (await templateNpm.exists()) {
                    log.success('更新模板成功')
                    this.templateNpm = templateNpm
                }
            }
        }
        //1、通过项目模板API获取项目模板信息
        //1.1 通过egg.js搭建一套后端系统
        //1.2通过npm存储项目模板
        //1.3将项目模板信息存储到mongodb数据库中
        //1.4通过egg.js获取mongodb中的数据并且通过API返回
    }
    async prepare() {
        //0、判断项目模板是否存在
        const template = await getProjectTemplate()
        if (!template || template.length === 0) {
            throw new Error('项目模板不存在')
        }
        this.template = template
        //1、判断当前目录是否为空
        const localPath = process.cwd()
        if (!this.isDirEmpty(localPath)) {
            let ifContinue = false
            //询问是否继续创建
            if (!this.force) {
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                })).ifContinue
            }
            if (ifContinue) {
                return
            }
            //2、是否启动强制更新
            if (ifContinue || this.force) {
                //给用户做第二次确认
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？'
                })
                if (confirmDelete) {
                    //清空当前目录
                    fse.emptyDirSync(localPath)
                }
            }
        }
        return this.getProjectInfo()

    }
    async getProjectInfo() {
        //1、选择创建项目或者组件
        function isValidName(v) {
            return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
        }
        let projectInfo = {}
        let isProjectNameValid = false
        if (isValidName(this.projectName)) {
            isProjectNameValid = true
            projectInfo.projectName = this.projectName
        }
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [{
                name: '项目',
                value: TYPE_PROJECT
            }, {
                name: '组件',
                value: TYPE_COMPONENT
            }]
        })
        log.verbose('type', type)
        if (type === TYPE_PROJECT) {
            //2、获取项目的基本信息
            const projectNamePrompt = {
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function (v) {
                    //1、首字符必须为英文字符
                    //2、尾字符必须为英文或数字，不能为字符
                    //3、字符仅允许“-_”
                    var done = this.async()
                    setTimeout(function () {
                        if (!isValidName(v)) {
                            done('请输入合法的项目名称')
                            return
                        }
                        done(null, true)
                    }, 0)
                },
                filter: function (v) {
                    return v
                }
            }
            const projectPrompt = []
            if (!isProjectNameValid) {
                projectPrompt.push(projectNamePrompt)
            }
            projectPrompt.push({
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
                default: '1.0.0',
                validate: function (v) {
                    var done = this.async()
                    setTimeout(function () {
                        if (!(!!semver.valid(v))) {
                            done('请输入合法的版本号名称')
                            return
                        }
                        done(null, true)
                    }, 0)

                },
                filter: function (v) {
                    if (!!semver.valid(v)) {
                        return semver.valid(v)
                    } else {
                        return v
                    }
                }
            }, {
                type: 'list',
                name: 'projectTemplate',
                message: '请选择项目模板',
                choices: this.createTemplateChoice()
            })
            const project = await inquirer.prompt(projectPrompt)
            projectInfo = {
                ...projectInfo,
                type,
                ...project
            }
        } else if (type === TYPE_COMPONENT) {

        }
        //生成className
        if (projectInfo.projectName) {
            projectInfo.name = projectInfo.projectName
            projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
        }
        if (projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion
        }
        return projectInfo

    }
    isDirEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        fileList = fileList.filter(file => (
            //去除.git,node_modules
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ))
        return !fileList || fileList.length <= 0
    }
    createTemplateChoice() {
        return this.template.map(item => ({
            value: item.npmName,
            name: item.name
        }))
    }
}
function init(argv) {
    // console.log('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH)
    return new InitCommand(argv)

}

module.exports.InitCommand = InitCommand
module.exports = init