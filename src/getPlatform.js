'use strict'

function getPlatform () {
  const p = require('os').platform()

  if (p === 'darwin') {
    debug('Platform: %s', p)

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
