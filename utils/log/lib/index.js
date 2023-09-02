'use strict';

const log = require('npmlog')
const semver = require('semver')

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'

log.heading = 'fish'
log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log