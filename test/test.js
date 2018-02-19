/* eslint-env mocha */
'use strict'

const fs = require('fs')
const path = require('path')
const SteamConfig = require('../index.js')
const Dummy = require('steam-dummy')
require('chai').should() // eslint-disable-line no-unused-vars

let dumbass = new Dummy()

let steam
let pathTo = path.join(__dirname, 'Dummy')

if (!fs.existsSync(pathTo)) {
  dumbass.makeDummy(pathTo)
}

console.info('Dummy data created.')

describe('SteamConfig', function () {
  beforeEach(function () {
    steam = new SteamConfig()
  })

  afterEach(function () {
    steam = undefined
  })

  describe('#detectRoot(autoSet)', function () {
    it('should detect & set the default path if autoSet is true', function detectRootAndAutoSet () {
      steam.detectRoot(true)

      steam.rootPath.should.not.equal(undefined)
    })

    it('should detect & return the default path if autoSet is false', function detectRootAndReturn () {
      let detected = steam.detectRoot()

      detected.should.not.equal(undefined)
    })
  })

  describe('#setRoot(toPath)', function () {
    it('should accept a string value as the argument', function setRootToDummy () {
      steam.setRoot(pathTo)
    })

    it('should not accept a non-string value as the argument', function setRootOnlyLikesStrings () {
      try {
        steam.setRoot(8675309)

        throw new Error('It did not throw an error for an invalid argument.')
      } catch (err) {
        if (err.message.indexOf('is an invalid path argument') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should not accept a non-existent path as the argument', function setRootOnlyLikesPathsThatExist () {
      try {
        steam.setRoot(path.join('Batman'))

        throw new Error('It did not throw an error for an invalid argument.')
      } catch (err) {
        if (err.message.indexOf('does not exist') === -1) {
          throw new Error(err)
        }
      }
    })
  })
})

describe('SteamConfig', function () {
  beforeEach(function () {
    steam = new SteamConfig()
    steam.setRoot(pathTo)
    steam.currentUser = {
      id64: '76561198067577712',
      accountId: '107311984'
    }
  })

  afterEach(function () {
    steam = undefined
  })

  describe('#detectUser', function () {
    it('should detect the user if possible', async function () {
      await steam.load(steam.getPath('loginusers'))
      await steam.load(steam.getPath('registry'))
      steam.registry.should.be.a('object')
      steam.loginusers.should.be.a('object')
      let user = steam.detectUser()
      user.should.equal('76561198067577712')
    })

    it('should throw an error if a user is not found', function () {
      try {
        let user = steam.detectUser()
        user.should.not.exist()
      } catch (err) {
        if (err.message.indexOf('Could not detect user.') === -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#setUser', function () {
    it('should detect and set the user if possible', async function () {
      await steam.load(steam.getPath('loginusers'))
      steam.setUser('l3l_aze')
      steam.currentUser.should.equal('76561198067577712')
    })

    it('should throw an error if the user is not found', async function () {
      try {
        await steam.load(steam.getPath('loginusers'))
        steam.setUser('Batman')
      } catch (err) {
        if (err.message.indexOf('is an invalid user identifier.') === -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#getPath(name, id, extra)', function () {
    it('should throw an error for an invalid name argument', function () {
      try {
        steam.getPath('somewhere')
      } catch (err) {
        if (err.message.indexOf('Cannot find path to invalid argument') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should return a "descriptive" object for each path', function () {
      steam.getPath('appinfo').should.have.property('path')
      steam.getPath('config').should.have.property('path')
      steam.getPath('libraryfolders').should.have.property('path')
      steam.getPath('localconfig', steam.currentUser.id64, steam.currentUser.accountId).should.have.property('path')
      steam.getPath('loginusers').should.have.property('path')
      steam.getPath('registry').should.have.property('path')
      steam.getPath('sharedconfig', steam.currentUser.id64, steam.currentUser.accountId).should.have.property('path')
      steam.getPath('shortcuts', steam.currentUser.id64, steam.currentUser.accountId).should.have.property('path')
      steam.getPath('skins').should.have.property('path')
      steam.getPath('steamapps').should.have.property('path')
    })

    it('should map the special entry "all" to all the other entries', function () {
      let paths = steam.getPath('all', steam.currentUser.id64, steam.currentUser.accountId)
      paths.should.be.a('array').with.length(10)
    })
  })

  describe('#load(name)', function () {
    it('should throw an error for an invalid argument', async function () {
      try {
        await steam.load('something')
      } catch (err) {
        if (err.message.indexOf('is an invalid argument to load(). Should be an \'object\', or an \'array\' of \'object\' entries.') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should load config as requested', async function loadConfig () {
      await steam.load(steam.getPath('config'))
      steam.config.should.have.property('InstallConfigStore')
    })

    it('should load libraryfolders as requested', async function loadLibraryFolders () {
      await steam.load(steam.getPath('libraryfolders'))
      steam.libraryfolders.should.have.property('LibraryFolders')
    })

    it('should load loginusers as requested', async function loadLoginUsers () {
      await steam.load(steam.getPath('loginusers'))
      steam.loginusers.should.have.property('users')
    })

    it('should load skins as requested', async function loadSkins () {
      await steam.load(steam.getPath('skins'))
      steam.skins.should.be.a('array')
    })

    it('should load a steamapps folder as requested', async function loadSteamApps () {
      await steam.load(steam.getPath('steamapps'))
      steam.steamapps.should.be.a('array')
    })

    it('should load registry as requested', async function loadRegistry () {
      await steam.load(steam.getPath('registry'))
      steam.registry.should.have.property('Registry')
    })

    it('should load shortcuts as requested', async function loadShortcuts () {
      await steam.load(steam.getPath('loginusers'))
      await steam.load(steam.getPath('shortcuts', steam.currentUser.id64, steam.currentUser.accountId))
      steam.loginusers.users[ steam.currentUser.id64 ].shortcuts.should.have.property('shortcuts')
    })

    it('should load localconfig as requested', async function loadLocalConfig () {
      await steam.load(steam.getPath('loginusers'))
      await steam.load(steam.getPath('localconfig', steam.currentUser.id64, steam.currentUser.accountId))
      steam.loginusers.users[ steam.currentUser.id64 ].localconfig.should.have.property('UserLocalConfigStore')
    })

    it('should load sharedconfig as requested', async function loadSharedConfig () {
      await steam.load(steam.getPath('loginusers'))
      await steam.load(steam.getPath('sharedconfig', steam.currentUser.id64, steam.currentUser.accountId))
      steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig.should.have.property('UserRoamingConfigStore')
    })

    it('should load appinfo..though slowly', async function loadAppinfo () {
      await steam.load(steam.getPath('appinfo'))
      steam.appinfo.should.be.a('array')
    })
  })
})
