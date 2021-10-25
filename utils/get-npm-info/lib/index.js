'use strict';

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

function getNpmInfo(npmName, registry = getDefaultRegistry()) {
    if (!npmName) {
        return null
    }
    const npmInfoUrl = urlJoin(registry, npmName)
    return axios.get(npmInfoUrl).then(res => {
        if (res.status === 200) {
            return res.data
        }
        return null
    }).catch(err => {
        return Promise.reject(err.message)
    })
}

async function getNpmVersions(npmName, registry = getDefaultRegistry()) {
    const data = await getNpmInfo(npmName, registry)
    if (data.versions) {
        return Object.keys(data.versions)
    } else {
        return []
    }
}

function getNpmSemverVersions(baseVersion, versions) {
    return versions
            .filter(version => semver.satisfies(version, `^${baseVersion}`))
            .sort((a, b) => semver.gt(a, b))
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
    const versions = await getNpmVersions(npmName, registry)
    const newVersions = getNpmSemverVersions(baseVersion, versions)
    return newVersions?.length > 0 ? newVersions[0] : null
}

function getDefaultRegistry(isOriginal = true) {
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersion,
};
