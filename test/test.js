/* eslint-env mocha */
'use strict'

const path = require('path')
const SteamConfig = require('../lib/index.js')
const Dummy = require('steam-dummy')
const should = require('chai').should() // eslint-disable-line no-unused-vars
const arch = require('os').arch()
const platform = require('os').platform()
const {Registry} = require('rage-edit')

let dummy = new Dummy()
let pathTo
let steam
let winreg

if (process.env.CI === true) {
  if (platform === 'darwin') {
    pathTo = path.join(require('os').homedir(), 'Library', 'Application Support', 'Steam')
  } else if (platform === 'linux') {
    pathTo = path.join(require('os').homedir(), '.steam')
  } else if (platform === 'win32') {
    if (arch === 'ia32') {
      pathTo = path.join('C:', 'Program Files', 'Steam')
    } else if (arch === 'ia64') {
      pathTo = path.join('C:', 'Program Files (x86)', 'Steam')
    }
  }
} else {
  pathTo = path.join(__dirname, 'Dummy')
}

if (platform === 'win32') {
  winreg = new Registry('HKCU\\Software\\Valve\\Steam')
}

describe('SteamConfig', function () {
  beforeEach(async function () {
    await dummy.makeDummy(pathTo, true)
    steam = new SteamConfig()
  })

  afterEach(function () {
    if (platform === 'win32' && winreg.has('HKCU\\Software', 'Valve')) {
      winreg.delete('HKCU\\Software', 'Valve')
    }
    steam = undefined
  })

  describe('#detectRoot(autoSet)', function () {
    if (new SteamConfig().detectRoot() === null) {
      console.error('Error: Steam has not been installed on this machine; cannot test detectRoot.')
      this.pending = true
    }

    it('should detect & set the path', function detectRootAndAutoSet () {
      steam.detectRoot(true)
      if (steam.rootPath === null) {
        console.error('Error: Steam has not been installed on this machine; cannot test detectRoot.')
        this.pending = true
      }
      steam.rootPath.should.not.equal(null)
      steam.paths.rootPath.should.equal(steam.detectRoot())
    })

    it('should detect & return the path', function detectRootAndReturn () {
      let detected = steam.detectRoot()
      should.not.equal(detected, null)
    })
  })

  describe('#setRoot(toPath)', function () {
    it('should throw for a non-string or empty arg', function setRootThrowsForBadArgs () {
      try {
        steam.setRoot(8675309)

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('is an invalid path argument') === -1) {
          throw new Error(err)
        }
      }

      try {
        steam.setRoot()

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('is an invalid path argument.') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should throw for an invalid root path', function setRootThrowsForInvalid () {
      try {
        steam.setRoot(__dirname)

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('does not seem to be a valid Steam installation.') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should throw for a nonexistent path', function setRootThrowsForNonexistent () {
      try {
        steam.setRoot(path.join(__dirname, 'Batman'))

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should accept a string value as the argument', function setRootWorks () {
      steam.setRoot(pathTo)
    })
  })
})

describe('SteamConfig', function () {
  beforeEach(async function () {
    await dummy.makeDummy(pathTo, true)
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
    if (platform === 'win32' && winreg.has('HKCU\\Software', 'Valve')) {
      winreg.delete('HKCU\\Software', 'Valve')
    }
    steam = undefined
  })

  describe('#detectUser', function () {
    it('should throw an error if a user is not found', function () {
      try {
        let user = steam.detectUser()
        user.should.not.exist()

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('Could not detect user.') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should detect the user if possible', async function () {
      await steam.load([steam.paths.loginusers, steam.paths.registry])
      steam.registry.should.be.a('object')
      steam.loginusers.should.be.a('object')
      let user = steam.detectUser()
      user.should.equal('76561198067577712')
    })

    it('should detect and set the user if possible', async function () {
      await steam.load([steam.paths.loginusers, steam.paths.registry])
      steam.registry.should.be.a('object')
      steam.loginusers.should.be.a('object')
      steam.detectUser(true)
      steam.currentUser.id64.should.equal('76561198067577712')
    })
  })

  describe('#setUser(identifer)', function () {
    it('should throw an error if the user is not found', async function () {
      try {
        await steam.load(steam.paths.loginusers)
        steam.setUser('Batman')

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('is an invalid user identifier.') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should set the user if detected based on identifer', async function () {
      await steam.load(steam.paths.loginusers)
      steam.setUser('l3l_aze')
      steam.currentUser.id64.should.equal('76561198067577712')
    })
  })

  describe('#load(name)', function () {
    it('should throw an error for an unknown entry', async function () {
      try {
        await steam.load('something')

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('Cannot load unknown entry type') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should throw an error for an invalid argument', async function () {
      try {
        await steam.load({something: 'something, something; blah blah blah.'})

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('is an invalid arg. Should be a string, or an array of strings.') === -1) {
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
      steam.steamapps.should.be.a('array').and.have.property('length').equal(2)
    })

    it('should append another steamapps folder as requested', async function loadMoreSteamApps () {
      await steam.load([steam.paths.steamapps(), steam.paths.libraryfolders])
      steam.appendToApps = true
      steam.libraryfolders.LibraryFolders[ '1' ] = path.join(pathTo, 'External Steam Library Folder')
      await steam.load(steam.paths.steamapps(steam.libraryfolders.LibraryFolders[ '1' ]))
      await steam.load(steam.paths.steamapps())
      steam.steamapps.should.be.a('array').and.have.property('length').equal(4)
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
    it('should throw an error for an unknown entry', async function () {
      try {
        await steam.save('something')

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('Cannot save unknown entry') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should throw an error for an invalid argument', async function () {
      try {
        await steam.save({something: 'something, something; blah blah blah.'})

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('is an invalid arg. Should be a string, or an array of strings.') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should save config as requested', async function saveConfig () {
      let original
      let modified

      await steam.load(steam.paths.config)
      original = Object.assign(steam.config)
      await steam.save(steam.paths.config)
      modified = steam.config
      original.InstallConfigStore.should.equal(modified.InstallConfigStore)
    })

    it('should save loginusers as requested', async function saveLoginUsers () {
      let original
      let modified

      await steam.load(steam.paths.loginusers)
      original = Object.assign(steam.loginusers)
      await steam.save(steam.paths.loginusers)
      modified = steam.loginusers
      original.should.equal(modified)
    })

    it('should save localconfig as requested', async function saveLocalConfig () {
      let original
      let modified

      await steam.load([steam.paths.loginusers, steam.paths.localconfig])
      original = JSON.stringify(Object.assign(steam.loginusers.users[ steam.paths.id64 ].localconfig))
      await steam.save(steam.paths.localconfig)
      modified = JSON.stringify(Object.assign(steam.loginusers.users[ steam.paths.id64 ].localconfig))
      original.should.equal(modified)
    })

    it('should save sharedconfig as requested', async function saveSharedConfig () {
      let original
      let modified

      await steam.load([steam.paths.loginusers, steam.paths.sharedconfig])
      original = JSON.stringify(Object.assign(steam.loginusers.users[ steam.paths.id64 ].sharedconfig))
      await steam.save(steam.paths.sharedconfig)
      modified = JSON.stringify(Object.assign(steam.loginusers.users[ steam.paths.id64 ].sharedconfig))
      original.should.equal(modified)
    })

    it('should save registry as requested', async function saveRegistry () {
      let original
      let modified

      await steam.load(steam.paths.registry)
      original = JSON.stringify(Object.assign(steam.registry))
      await steam.save(steam.paths.registry)
      modified = JSON.stringify(Object.assign(steam.registry))
      original.should.equal(modified)
    })

    it('should throw if an app cannot be found', async function saveAppThrows () {
      let original
      let modified
      try {
        await steam.load(steam.paths.steamapps())
        let app = steam.steamapps[ 0 ]
        original = steam.strip('steamapps')[ 0 ]
        steam.steamapps[ 0 ].AppState.StateFlags = '512'
        await steam.save(steam.paths.app(app.AppState.appid + 1, app.library))
        modified = steam.strip('steamapps')[ 0 ]
        original.should.equal(modified)

        throw new Error('Did not fail.')
      } catch (err) {
        if (err.message.indexOf('does not exist.') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should save an app as requested', async function saveAppWorks () {
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
