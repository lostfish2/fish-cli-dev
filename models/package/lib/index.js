'use strict';
const pkgDir = require('pkg-dir').sync
const pathExisits = require('path-exists').sync
const fse = require('fs-extra')
const path = require('path')
const npminstall = require('npminstall')
const { isObject } = require('@fish-cli-dev/utils')
const formatPath = require('@fish-cli-dev/format-path')
const { getDefaultRegistry, getNpmLatestVersion } = require('@fish-cli-dev/get-npm-info');


class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类中的options不能为空!')
    }
    if (!isObject(options)) {
      throw new Error('Package类中的options必须为对象!')
    }
    //package的目标路径
    this.targetPath = options.targetPath
    //package的缓存路径
    this.storeDir = options.storeDir
    //package的name
    this.packageName = options.packageName
    //packge的version
    this.packageVersion = options.packageVersion
    //package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }
  async prepare() {
    if (this.storeDir && !pathExisits(this.storeDir)) {
      fse.mkdirpSync(this.storeDir)
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
  }
  get whichSys() {
    if (pathExisits(this.cacheFilePath)) {
      //linux
      return true
    } else {
      //windows
      return false
    }
  }
  get cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
  }
  get cacheFilePathWin() {
    return path.resolve(this.storeDir, `.store\\${this.packageName}@${this.packageVersion}`)
  }
  get cacheFilePathWinModule() {
    return path.resolve(this.storeDir, `${this.packageName}`)
  }
  get sysCacheFilePath() {
    if (pathExisits(this.cacheFilePath)) {
      return this.cacheFilePath
    } else {
      return this.cacheFilePathWin
    }
  }
  getSpecificCacheFilePath(packageVersion) {
    return pathExisits(this.cacheFilePath) ? path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`) : path.resolve(this.storeDir, `.store\\${this.packageName}@${packageVersion}`)
  }
  //判断当前package是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare()
      if (pathExisits(this.cacheFilePath)) {
        return true
      } else {
        return pathExisits(this.cacheFilePathWin)
      }
    } else {
      return pathExisits(this.targetPath)
    }
  }

  //安装package
  async install() {
    await this.prepare()
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [{
        name: this.packageName,
        version: this.packageVersion
      }]
    })
  }
  //更新package
  async update() {
    await this.prepare()
    //1.获取最新的npm模块版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName)
    //2.查询更新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
    //3.如果不存在直接安装最新版本
    if (!pathExisits(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [{
          name: this.packageName,
          version: latestPackageVersion
        }]
      })
      this.packageVersion = latestPackageVersion
    } else {
      this.packageVersion = latestPackageVersion
    }
  }
  //获取入口文件的路径
  getRootFilePath() {
    function _getRootFile(targetPath) {
      //1、获取package.json所在目录
      const dir = pkgDir(targetPath)
      //2.读取package.json内容
      if (dir) {
        const pkgFile = require(path.resolve(dir, 'package.json'))
        //3.寻找main/lib
        if (pkgFile && pkgFile.main) {
          //4.路径的兼容（macOS/windows）
          return formatPath(path.resolve(dir, pkgFile.main))
        } else {
          //fixed:windows下直接调用nodemodule中index.js，不调用.store中模块，支持es import引入后没有main入口
          return formatPath(path.resolve(dir, index.js))
        }
      }
      return null
    }
    if (this.storeDir) {
      let path = this.cacheFilePathWinModule
      return _getRootFile(path)
    } else {
      return _getRootFile(this.targetPath)
    }
  }
}

module.exports = Package;

