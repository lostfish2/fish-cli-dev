'use strict';

const axios = require('axios')
const urlJoin = require("url-join")
const semver = require('semver')


function getNpmInfo(npmName, registry) {
  if (!npmName) return null
  const registryUrl = registry || getDefaultRegistry()
  const npmInfoUrl = urlJoin(registryUrl, npmName)
  return axios.get(npmInfoUrl).then(res => {
    if (res.status === 200) {
      return res.data
    }
    return null
  }).catch(err => {
    return Promise.reject(err)
  })
}

function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}
//获取版本号数组
async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry)
  if (data) {
    return Object.keys(data.versions)
  } else {
    return []
  }
}
//获取高于当前版本号的数组
function getSemverVersions(baseVersion, versions) {
  return versions
    .filter(version =>
      semver.satisfies(version, `^${baseVersion}`))
    .sort((a, b) => semver.gt(b, a))

}
//获取当前最高版本
async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersions = getSemverVersions
  if (newVersions && newVersions.length > 0) {
    return newVersions[0]
  }
}
async function getNpmLatestVersion(npmName, registry) {
  let versions = await getNpmVersions(npmName, registry)
  if (versions) {
    return versions.sort((a, b) => semver.gt(a, b))[versions.length - 1]
  }

  return null
}
module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersion,
  getDefaultRegistry,
  getNpmLatestVersion,
}