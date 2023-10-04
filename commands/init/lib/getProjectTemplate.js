const request = require('@fish-cli-dev/request')

module.exports = function () {
    return request({
        url: '/project/template'
    })
}