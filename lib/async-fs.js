'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')

const readFileAsync = async function (filePath) {
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

const writeFileAsync = async function (filePath, data) {
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
const mkdirpAsync = async function (filePath) {
  return new Promise((resolve, reject) => {
    mkdirp(filePath, undefined, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

module.exports = {
  readFileAsync,
  writeFileAsync,
  mkdirpAsync
}
