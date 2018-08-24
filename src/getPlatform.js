'use strict'

const getPlatform = function getPlatform () {
  const p = require('os').platform()

  if (p === 'darwin') {
    return 'mac'
  } else if (p === 'android') {
    return 'linux'
  } else {
    return p
  }
}

module.exports = {
  getPlatform
}
