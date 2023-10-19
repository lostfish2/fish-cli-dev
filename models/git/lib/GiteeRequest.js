const axios = require('axios')
const BASE_URL = 'https://gitee.com/api/v5'
//44669f0d424234d2006f183a73f717d1
class GiteeRequest {
    constructor(token) {
        this.token = token
        this.service = axios.create({
            baseURL: BASE_URL
        })
        this.service.interceptors.response.use(
            response => {
                return response.data
            },
            error => {
                if (error.response && error.response.data) {
                    return error.response.data
                } else {
                    return Promise.reject(error)
                }
            }
        )
    }
    get(url, params, headers) {
        return this.service({
            url,
            params: {
                ...params,
                access_token: this.token
            },
            method: 'get',
            headers
        })
    }
    post(url, data, headers) {
        return this.service({
            url,
            params: {
                access_token: this.token
            },
            method: 'post',
            data,
            headers
        })
    }
}
module.exports = GiteeRequest