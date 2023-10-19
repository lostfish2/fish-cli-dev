const GitServer = require("./GitServer");
const GithubRequest = require('./GithubRequest')

class Github extends GitServer {
    constructor() {
        super('github')
    }
    setToken(token) {
        super.setToken(token)
        this.request = new GithubRequest(token)
    }

    getUser() {
        return this.request.get('/user')
    }
    getOrg(username) {
        return this.request.get(`/user/orgs`, {
            page: 1,
            per_page: 100,
        })

    }
    getRepo(login, name) {
        return this.request
            .get(`/repos/${login}/${name}`)
            .then(response => {
                return this.handleResponse(response)
            })
    }
    createRepo(name) {
        return this.request.post('/users/repos', {
            name
        })
    }
    createOrgRepo(name, login) {
        return this.request.post(`/orgs/${login}/repos`, {
            name
        })
    }
    getRemote(login, name) {
        return `git@github.com:${login}/${name}.git`
    }
    getTokenUrl() {
        return 'https://github.com/settings/tokens'
    }
    getTokenHelpUrl() {
        return 'https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh'
    }
}

module.exports = Github