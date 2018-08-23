/* eslint-env mocha */
'use strict'

const path = require('path')
const chai = require('chai')
const expect = chai.expect
const platform = require('./../src/getPlatform.js').getPlatform()
const steamPaths = require('./../src/steamPaths.js')
const platformPaths = require('./../src/platformPaths.js')

const id64 = '76561198067577712'
const accountID = '107311984'

describe('Module SteamPaths', function spDescriptor () {
  this.slow(0)

  describe('#constructor', function spContructorDescriptor () {
    it('should initialize when required', function spInitsOnRequire () {
      expect(steamPaths).to.be.a('object')
      expect(steamPaths).to.have.property('root')
      expect(steamPaths).to.have.property('id64')
      expect(steamPaths).to.have.property('accountID')
      expect(steamPaths).to.have.property('appinfo')
      expect(steamPaths).to.have.property('config')
      expect(steamPaths).to.have.property('libraryfolders')
      expect(steamPaths).to.have.property('localconfig')
      expect(steamPaths).to.have.property('loginusers')
      expect(steamPaths).to.have.property('registry')
      expect(steamPaths).to.have.property('sharedconfig')
      expect(steamPaths).to.have.property('shortcuts')
      expect(steamPaths).to.have.property('steamapps')
      expect(steamPaths).to.have.property('skins')
    })
  })

  describe('paths', function spPathsDescriptor () {
    it('should return platform-specific paths', function spIsPlatformFriendly () {
      expect(steamPaths).to.be.a('object')
      steamPaths.id64 = id64
      steamPaths.accountID = accountID

      expect(steamPaths.id64).to.equal(id64)
      expect(steamPaths.accountID).to.equal(accountID)

      expect(steamPaths.root).to.equal(path.join(platformPaths[ platform ].root))
      expect(steamPaths.appinfo).to.equal(path.join(steamPaths.root, platformPaths[ platform ].appinfo))
      expect(steamPaths.config).to.equal(path.join(steamPaths.root, platformPaths[ platform ].config))
      expect(steamPaths.libraryfolders).to.equal(path.join(steamPaths.root, platformPaths[ platform ].libraryfolders))
      expect(steamPaths.localconfig).to.equal(path.join(steamPaths.root, platformPaths[ platform ].localconfig.replace('accountID', accountID)))
      expect(steamPaths.loginusers).to.equal(path.join(steamPaths.root, platformPaths[ platform ].loginusers))
      expect(steamPaths.registry).to.equal(path.join(steamPaths.root, platformPaths[ platform ].registry))
      expect(steamPaths.sharedconfig).to.equal(path.join(steamPaths.root, platformPaths[ platform ].sharedconfig.replace('accountID', accountID)))
      expect(steamPaths.shortcuts).to.equal(path.join(steamPaths.root, platformPaths[ platform ].shortcuts.replace('accountID', accountID)))
      expect(steamPaths.steamapps).to.equal(path.join(steamPaths.root, platformPaths[ platform ].steamapps))
      expect(steamPaths.skins).to.equal(path.join(steamPaths.root, platformPaths[ platform ].skins))
    })
  })
})
