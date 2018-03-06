/* eslint-env mocha */
'use strict'

const path = require('path')
const SteamPaths = require('../lib/steam-paths.js')
const Dummy = require('steam-dummy')
require('chai').should() // eslint-disable-line no-unused-vars

const pathTo = path.join(__dirname, 'Dummy')
const id64 = '76561198067577712'
const accountId = '107311984'
const home = require('os').homedir()

let dummy = new Dummy()
let paths

describe('SteamPaths', function () {
  beforeEach(async function () {
    await dummy.makeDummy(pathTo, true)
  })

  describe('#constructor', function () {
    it('should set the rootPath, id64, and accountId with the constructor', function constructorSetProps () {
      paths = new SteamPaths(pathTo, id64, accountId)
      paths.rootPath.should.equal('')
      paths.id64.should.equal(0)
      paths.accountId.should.equal(0)
    })

    it('should throw an error for invalid args', function constructorThrowArgs () {
      try {
        paths = new SteamPaths('Hello world!')
      } catch (err) {
        if (err.message.indexOf('Invalid arguments to SteamPaths constructor') === -1) {
          throw new Error(err)
        }
      }
    })
  })
})

describe('SteamPaths', function () {
  beforeEach(async function () {
    await dummy.makeDummy(pathTo, true)
    paths = new SteamPaths()
    paths.rootPath = pathTo
    paths.id64 = id64
    paths.accountId = accountId
  })

  afterEach(function () {
    paths = undefined
  })

  describe('#rootPath', function () {
    it('should throw an error for an invalid arg to set', function setRootPathThrows () {
      try {
        paths.rootPath = path.join(paths.rootPath, 'Batman')

        throw new Error('did not fail')
      } catch (err) {
        if (err.message.indexOf('is an invalid root path because it does not exist') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should throw an error for an empty arg to set', function setRootPathThrows () {
      try {
        paths.rootPath = ''

        throw new Error('did not fail')
      } catch (err) {
        if (err.message.indexOf('is an invalid root path') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should get the rootPath', function getRootPath () {
      paths.rootPath.should.equal(pathTo)
    })

    it('should set the rootPath', function setRootPath () {
      paths.rootPath = home
      paths.rootPath.should.equal(home)
    })
  })

  describe('#id64', function () {
    it('should throw an error for an invalid arg to set', function setId64Throws () {
      try {
        paths.id64 = {id64: id64}

        throw new Error('Did not fail')
      } catch (err) {
        if (err.message.indexOf('is an invalid id64') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should get the id64', function getId64 () {
      paths.id64.should.equal(id64)
    })

    it('should set the id64', function setId64 () {
      paths.id64 = '420'
      paths.id64.should.equal('420')
    })
  })

  describe('#accountId', function () {
    it('should throw an error for an invalid arg to set', function setAccountIdThrows () {
      try {
        paths.accountId = {accountId: accountId}

        throw new Error('Did not fail')
      } catch (err) {
        if (err.message.indexOf('is an invalid accountId') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should get the accountId', function getAccountId () {
      paths.accountId.should.equal(accountId)
    })

    it('should set the accountId', function setAccountId () {
      paths.accountId = '420'
      paths.accountId.should.equal('420')
    })
  })

  describe('#all', function () {
    it('should get all (9) paths at once', function getAll () {
      let pathList = paths.all

      pathList.should.include(paths.appinfo)
      pathList.should.include(paths.config)
      pathList.should.include(paths.libraryfolders)
      pathList.should.include(paths.localconfig)
      pathList.should.include(paths.loginusers)
      pathList.should.include(paths.registry)
      pathList.should.include(paths.sharedconfig)
      pathList.should.include(paths.shortcuts)
      pathList.should.include(paths.skins)
      pathList.should.have.length(9)
    })
  })

  describe('#app', function () {
    it('should throw an error for an empty appid arg', function getAppThrowsEmpty () {
      try {
        paths.app('')

        throw new Error('Did not fail')
      } catch (err) {
        if (err.message.indexOf('Need an appid to get the path to an app') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should throw an error for a nonexistent app', function getAppThrowsNoApp () {
      try {
        paths.app('223')

        throw new Error('Did not fail')
      } catch (err) {
        if (err.message.indexOf('App file') !== -1 && err.message.indexOf('appmanifest_223.acf does not exist') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should throw an error for a nonexistent library', function getAppThrowsNoLib () {
      try {
        paths.app('420', '/Batman')

        throw new Error('Did not fail')
      } catch (err) {
        if (err.message.indexOf('does not exist. If it is on an external drive make sure it is properly plugged in and mounted and try again') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should get the path to an app', function getApp () {
      paths.app('420').should.be.a('string')
      paths.app('8675309').should.be.a('string')
    })
  })

  describe('#appinfo', function () {
    it('should get the path to appinfo.vdf', function getAppInfo () {
      paths.appinfo.should.be.a('string')
    })
  })

  describe('#config', function () {
    it('should get the path to config.vdf', function getConfig () {
      paths.config.should.be.a('string')
    })
  })

  describe('#libraryfolders', function () {
    it('should get the path to libraryfolders.vdf', function getLibraryFolders () {
      paths.libraryfolders.should.be.a('string')
    })
  })

  describe('#localconfig', function () {
    it('should get the path to localconfig.vdf', function getLocalConfig () {
      paths.localconfig.should.be.a('string')
    })
  })

  describe('#loginusers', function () {
    it('should get the path to loginusers.vdf', function getLoginUsers () {
      paths.loginusers.should.be.a('string')
    })
  })

  describe('#registry', function () {
    it('should get the path to registry.vdf or \'winreg\' on Windows', function getRegistry () {
      paths.registry.should.be.a('string')
    })
  })

  describe('#sharedconfig', function () {
    it('should get the path to sharedconfig.vdf', function getSharedConfig () {
      paths.sharedconfig.should.be.a('string')
    })
  })

  describe('#shortcuts', function () {
    it('should get the path to shortcuts.vdf', function getShortcuts () {
      paths.shortcuts.should.be.a('string')
    })
  })

  describe('#skins', function () {
    it('should get the path to skins', function getSkins () {
      paths.skins.should.be.a('string')
    })
  })

  describe('#steamapps', function () {
    it('should throw an error for a nonexistent library', function getAppThrowsEmpty () {
      try {
        paths.steamapps(path.join(paths.rootPath, 'Batman'))

        throw new Error('Did not fail')
      } catch (err) {
        if (err.message.indexOf(' folder does not exist') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should get the path to a steamapps folder', function getSteamapps () {
      paths.steamapps().should.be.a('string').and.equal(path.join(pathTo, 'steamapps'))
    })
  })

  describe('#all, #app, #appinfo, #config, #libraryfolders, #localconfig, #loginusers, #registry, #sharedconfig, #shortcuts, #skins, #steamapps', function () {
    it('should throw when rootPath is set to a folder that is not a Steam installation', function () {
      paths.rootPath = __dirname

      try {
        let val = paths.all

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.app('420')

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.appinfo

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.config

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.libraryfolders

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.localconfig

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.loginusers

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.registry

        if (val === 'registry.winreg') {
          throw new Error('Throwing winreg folder does not exist. So this test will pass on Windows.')
        }

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.sharedconfig

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.shortcuts

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.skins

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }

      try {
        let val = paths.steamapps()

        throw new Error(`Did not fail: ${val}`)
      } catch (err) {
        if (err.message.indexOf(' does not exist.') === -1) {
          throw new Error(err)
        }
      }
    })
  })
})
