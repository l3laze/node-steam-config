/* eslint-env mocha */
'use strict'

const path = require('path')
const chai = require('chai')
const makeDummy = require('steam-dummy')
const steam = require('./../src/index.js')

const expect = chai.expect

const platform = require('os').platform()

const id64 = '76561198067577712'
const accountID = '107311984'

let pathTo

if (typeof process.env.CI !== 'undefined' || process.env.SCTRP === true) { // Test Real Paths
  if (platform === 'darwin') {
    pathTo = path.join(require('os').homedir(), 'Library', 'Application Support', 'Steam')
  } else if (platform === 'linux') {
    pathTo = path.join(require('os').homedir(), '.steam')
  } else if (platform === 'win32') {
    if (!/64/.test(process.env.PROCESSOR_ARCHITECTURE)) {
      pathTo = path.join('C:', 'Program Files', 'Steam') // 32-bit Windows
    } else {
      pathTo = path.join('C:', 'Program Files (x86)', 'Steam') // 64-bit Windows
    }
  }
} else {
  pathTo = path.join(__dirname, 'Dummy')
}

console.info(`Testing with path ${pathTo}`)

describe('Module SteamConfig @notreq', function moduleDescriptor () {
  this.slow(0)

  before(async function initDummy () {
    await makeDummy(pathTo)
  })

  describe('#constructor', function constructorDescriptor () {
    it('should be initialized by require\'ing it', function initsOnReq () {
      expect(steam).to.have.property('files').and.have.property('root')
      steam.files.root = pathTo
      steam.files.id64 = id64
      steam.files.accountId = accountID
    })
  })

  describe('#something', function somethingDescriptor () {
    it('should do something', function somethingDoesSomething () {
      expect('something').to.equal('something')
    })
  })
})
