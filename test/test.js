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
    steam.paths.id64 = steam.currentUser.id64
    steam.paths.accountId = steam.currentUser.accountId
  })

  afterEach(function () {
    steam = undefined
  })

  describe('#detectUser', function () {
    it('should detect the user if possible', async function () {
      await steam.load([steam.paths.loginusers, steam.paths.registry])
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

  describe('#setUser(identifer)', function () {
    it('should set the user if detected based on identifer', async function () {
      await steam.load(steam.paths.loginusers)
      steam.setUser('l3l_aze')
      steam.currentUser.should.equal('76561198067577712')
    })

    it('should throw an error if the user is not found', async function () {
      try {
        await steam.load(steam.paths.loginusers)
        steam.setUser('Batman')
      } catch (err) {
        if (err.message.indexOf('is an invalid user identifier.') === -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#load(name)', function () {
    it('should throw an error for an invalid argument', async function () {
      try {
        await steam.load('something')
      } catch (err) {
        if (err.message.indexOf('Cannot load unknown entry type') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should load everything..though slowly', async function loadEverything () {
      await steam.load(steam.paths.all)
      steam.appinfo.should.be.a('array')
      steam.config.should.be.a('object')
      steam.loginusers.should.be.a('object')
      steam.registry.should.be.a('object')
      steam.loginusers.users[ steam.paths.id64 ].should.have.property('localconfig')
      steam.loginusers.users[ steam.paths.id64 ].sharedconfig.should.be.a('object')
      steam.loginusers.users[ steam.paths.id64 ].shortcuts.shortcuts.should.be.a('array')
      steam.loginusers.users[ steam.paths.id64 ].localconfig.should.be.a('object')
    })

    it('should load config as requested', async function loadConfig () {
      await steam.load(steam.paths.config)
      steam.config.should.have.property('InstallConfigStore')
    })

    it('should load libraryfolders as requested', async function loadLibraryFolders () {
      await steam.load(steam.paths.libraryfolders)
      steam.libraryfolders.should.have.property('LibraryFolders')
    })

    it('should load loginusers as requested', async function loadLoginUsers () {
      await steam.load(steam.paths.loginusers)
      steam.loginusers.should.have.property('users')
    })

    it('should load skins as requested', async function loadSkins () {
      await steam.load(steam.paths.skins)
      steam.skins.should.be.a('array')
    })

    it('should load a steamapps folder as requested', async function loadSteamApps () {
      await steam.load(steam.paths.steamapps())
      steam.steamapps.should.be.a('array')
    })

    it('should load registry as requested', async function loadRegistry () {
      await steam.load(steam.paths.registry)
      steam.registry.should.have.property('Registry')
    })

    it('should load shortcuts as requested', async function loadShortcuts () {
      await steam.load([steam.paths.loginusers, steam.paths.shortcuts])
      steam.loginusers.users[ steam.paths.id64 ].shortcuts.should.have.property('shortcuts')
    })

    it('should load localconfig as requested', async function loadLocalConfig () {
      await steam.load([steam.paths.loginusers, steam.paths.localconfig])
      steam.loginusers.users[ steam.currentUser.id64 ].localconfig.should.have.property('UserLocalConfigStore')
    })

    it('should load sharedconfig as requested', async function loadSharedConfig () {
      await steam.load([steam.paths.loginusers, steam.paths.sharedconfig])
      steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig.should.have.property('UserRoamingConfigStore')
    })

    it('should load appinfo..though slowly', async function loadAppinfo () {
      await steam.load(steam.paths.appinfo)
      steam.appinfo.should.be.a('array')
    })
  })

  describe('#save(name)', function () {
    it('should throw an error for an invalid argument', async function () {
      try {
        await steam.save('something')
      } catch (err) {
        if (err.message.indexOf('Cannot save unknown entry') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should save config as requested', async function loadConfig () {
      let original
      let modified

      await steam.load(steam.paths.config)
      original = Object.assign(steam.config)
      await steam.save(steam.paths.config)
      modified = steam.config
      original.InstallConfigStore.should.equal(modified.InstallConfigStore)
    })

    it('should save loginusers as requested', async function loadLoginUsers () {
      let original
      let modified

      await steam.load(steam.paths.loginusers)
      original = Object.assign(steam.loginusers)
      await steam.save(steam.paths.loginusers)
      modified = steam.loginusers
      original.should.equal(modified)
    })

    it('should save localconfig as requested', async function loadLocalConfig () {
      let original
      let modified

      await steam.load([steam.paths.loginusers, steam.paths.localconfig])
      original = JSON.stringify(Object.assign(steam.loginusers.users[ steam.paths.id64 ].localconfig))
      await steam.save(steam.paths.localconfig)
      modified = JSON.stringify(Object.assign(steam.loginusers.users[ steam.paths.id64 ].localconfig))
      original.should.equal(modified)
    })

    it('should save sharedconfig as requested', async function loadSharedConfig () {
      let original
      let modified

      await steam.load([steam.paths.loginusers, steam.paths.sharedconfig])
      original = JSON.stringify(Object.assign(steam.loginusers.users[ steam.paths.id64 ].sharedconfig))
      await steam.save(steam.paths.sharedconfig)
      modified = JSON.stringify(Object.assign(steam.loginusers.users[ steam.paths.id64 ].sharedconfig))
      original.should.equal(modified)
    })

    it('should save an app as requested', async function loadConfig () {
      let original
      let modified

      await steam.load(steam.paths.steamapps())
      let app = steam.steamapps[ 0 ]
      original = steam.strip('steamapps')[ 0 ]
      steam.steamapps[ 0 ].AppState.StateFlags = '512'
      await steam.save(steam.paths.app(app.AppState.appid, app.library))
      modified = steam.strip('steamapps')[ 0 ]
      original.should.equal(modified)
    })
  })
})
