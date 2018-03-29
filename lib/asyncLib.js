'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')

async function readFileAsync (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      /* istanbul ignore next */
      if (err) {
        return reject(err)
      }
      return resolve(data)
    })
  })
}

async function writeFileAsync (filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      /* istanbul ignore next */
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

/* istanbul ignore next */
async function mkdirpAsync (filePath) {
  return new Promise((resolve, reject) => {
    mkdirp(filePath, undefined, (err) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

/* istanbul ignore next */
async function unlinkAsync (filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      /* istanbul ignore next */
      return reject(err)
    })
    return resolve()
  })
}

module.exports = {
  readFileAsync,
  writeFileAsync,
  mkdirpAsync,
  unlinkAsync
}
