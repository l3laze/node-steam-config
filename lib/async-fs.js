'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')

const readFileAsync = async function readFileAsync (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      /* istanbul ignore next */
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

const writeFileAsync = async function writeFileAsync (filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      /* istanbul ignore next */
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

/* istanbul ignore next */
const mkdirpAsync = async function mkdirpAsync (filePath) {
  return new Promise((resolve, reject) => {
    mkdirp(filePath, undefined, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

const unlinkAsync = async function unlinkAsync (filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      /* istanbul ignore next */
      return reject(err)
    })
    resolve()
  })
}

module.exports = {
  readFileAsync,
  writeFileAsync,
  mkdirpAsync,
  unlinkAsync
}
