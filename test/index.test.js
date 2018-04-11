/* eslint-env mocha */
'use strict'

const path = require('path')
const chai = require('chai')
const makeDummy = require('steam-dummy')
const steam = require('./../src/index.js')
// const {Registry} = require('rage-edit')
// const rimraf = require('util').promisify(require('rimraf'))

const expect = chai.expect

const home = require('os').homedir()
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

  describe('#constructor', function () {
    it('should be initialized by require\'ing it', function initsOnReq () {
      expect(steam).to.have.property('paths').and.have.property('root')
      steam.paths.root = pathTo
      steam.paths.id64 = id64
      steam.paths.accountId = accountID
    })
  })

  describe('#detectRoot', function detectRootDescriptor () {
    it('should detect the default root path to Steam', async function detectsRoot () {
      const rp = await steam.detectRoot()

      if (platform === 'linux') {
        expect(rp).to.equal(path.join(home, '.steam'))
      } else if (platform === 'darwin') {
        expect(rp).to.equal(path.join(home, 'Library', 'Application Support', 'Steam'))
      } else if (platform === 'win32') {
        if (!/64/.test(process.env.PROCESSOR_ARCHITECTURE)) {
          expect(rp).to.equal(path.join('C:', 'Program Files', 'Steam'))
        } else {
          expect(rp).to.equal(path.join('C:', 'Program Files (x86)', 'Steam'))
        }
      }
    })

    it('should load the registry to detect the root path on Windows, if it has not been loaded', async function detectRootLoadsData () {
      if (platform === 'win32') {
        steam.registry = {}

        const rp = await steam.detectRoot()

        if (!/64/.test(process.env.PROCESSOR_ARCHITECTURE)) {
          expect(rp).to.equal(path.join('C:', 'Program Files', 'Steam'))
        } else {
          expect(rp).to.equal(path.join('C:', 'Program Files (x86)', 'Steam'))
        }
      } else {
        this.skip()
      }
    })

    it('should detect the root path to Steam and set paths.root', async function detectsAndSetsRoot () {
      await steam.detectRoot(true)
      const rp = steam.paths.root

      if (platform === 'linux') {
        expect(rp).to.equal(path.join(home, '.steam'))
      } else if (platform === 'darwin') {
        expect(rp).to.equal(path.join(home, 'Library', 'Application Support', 'Steam'))
      } else if (platform === 'win32') {
        if (!/64/.test(process.env.PROCESSOR_ARCHITECTURE)) {
          expect(rp).to.equal(path.join('C:', 'Program Files', 'Steam'))
        } else {
          expect(rp).to.equal(path.join('C:', 'Program Files (x86)', 'Steam'))
        }
      }
    })
  })

  describe('#setRoot', function setRootDescriptor () {
    it('should set the root to a valid path', async function setRootWorks () {
      const detectedRoot = await steam.detectRoot()

      await steam.setRoot(detectedRoot)

      expect(steam.paths.root).to.equal(detectedRoot)

      await steam.setRoot(pathTo)
    })

    it('should throw for an invalid path', async function setRootThrows () {
      try {
        await steam.setRoot('/hello/world')

        throw new Error('Did not throw')
      } catch (err) {
        if (err.message.indexOf('is an invalid root path to Steam') === -1) {
          throw err
        }
      }

      expect(steam.paths.root).to.equal(pathTo)
    })
  })

  describe('#detectUser', function detectUserDescriptor () {
    it('should detect the user', async function detectUser () {
      const user = await steam.detectUser()

      expect(user.id64).to.equal('76561198067577712')
      expect(user.accountId).to.equal('107311984')
    })

    it('should detect the user and set paths.id64 and paths.accountId', async function detectsAndSetsUser () {
      await steam.detectUser(true)
      const user = {
        id64: steam.paths.id64,
        accountId: steam.paths.accountId
      }

      expect(user.id64).to.equal('76561198067577712')
      expect(user.accountId).to.equal('107311984')
    })
  })

  describe('#setUser', function setUserDescriptor () {
    it('should throw for invalid args', async function setUserThrowsInvalid () {
      try {
        await steam.setUser('')

        throw new Error('Did not throw')
      } catch (err) {
        if (err.message.indexOf('is an invalid user identifier') === -1) {
          throw err
        }
      }
    })

    it('should throw for a nonexistent user', async function setUserThrowsNonexistent () {
      try {
        await steam.setUser('Batman')

        throw new Error('Did not throw')
      } catch (err) {
        if (err.message.indexOf('Could not find any user with the identifier') === -1) {
          throw err
        }
      }
    })

    it('should set the user id64 & account ID', async function setUserWorks () {
      await steam.setUser('l3l_aze')
      expect(steam.paths.id64).to.equal('76561198067577712')
      expect(steam.paths.accountId).to.equal('107311984')
    })
  })

  describe('#load', function loadDescriptor () {
    this.timeout(4000)

    it('should load single entries as requested', async function loadProperly () {
      await steam.load(steam.paths.appinfo)
      expect(steam.appinfo).to.be.a('array')

      await steam.load(steam.paths.config)
      expect(steam.config).to.be.a('object').and.have.property('InstallConfigStore')

      await steam.load(steam.paths.libraryfolders)
      expect(steam.libraryfolders).to.be.a('object').and.have.property('LibraryFolders')

      await steam.load(steam.paths.localconfig)
      expect(steam.localconfig).to.be.a('object').and.have.property('UserLocalConfigStore')

      await steam.load(steam.paths.loginusers)
      expect(steam.loginusers).to.be.a('object').and.have.property('users')

      await steam.load(steam.paths.registry)
      expect(steam.registry).to.be.a('object').and.have.property('Registry')

      await steam.load(steam.paths.sharedconfig)
      expect(steam.sharedconfig).to.be.a('object').and.have.property('UserRoamingConfigStore')

      await steam.load(steam.paths.shortcuts)
      expect(steam.shortcuts).to.be.a('object').and.have.property('shortcuts')

      await steam.load(steam.paths.skins)
      expect(steam.skins).to.be.a('array')

      await steam.load(steam.paths.steamapps())
      expect(steam.apps).to.be.a('array').and.have.length(2)
    })

    it('should load steamapps as requested', async function loadMoreApps () {
      let externalLib

      for (let k of Object.keys(steam.libraryfolders.LibraryFolders)) {
        if (k !== 'ContentStatsID' && k !== 'TimeNextStatsReport') {
          steam.libraryfolders.LibraryFolders[ k ] = path.join(pathTo, 'External Steam Library Folder')
          externalLib = steam.libraryfolders.LibraryFolders[ k ]
        }
      }

      await steam.load(steam.paths.steamapps(externalLib))
      expect(steam.apps).to.be.a('array').and.have.property('length').and.equal(4)

      await steam.load(steam.paths.steamapps())
      expect(steam.apps).to.be.a('array').and.have.property('length').and.equal(4)

      steam.append = false
      await steam.load(steam.paths.steamapps())
      expect(steam.apps).to.be.a('array').and.have.property('length').and.equal(2)
    })

    it('should load multiple/all entries as requested', async function loadProperly () {
      try {
        const everything = steam.paths.all
        steam.apps.length = 0

        await steam.load(everything)
        await steam.load(steam.paths.steamapps())
        expect(steam.appinfo).to.be.a('array')
        expect(steam.config).to.be.a('object').and.have.property('InstallConfigStore')
        expect(steam.libraryfolders).to.be.a('object').and.have.property('LibraryFolders')
        expect(steam.localconfig).to.be.a('object').and.have.property('UserLocalConfigStore')
        expect(steam.loginusers).to.be.a('object').and.have.property('users')
        expect(steam.registry).to.be.a('object').and.have.property('Registry')
        expect(steam.sharedconfig).to.be.a('object').and.have.property('UserRoamingConfigStore')
        expect(steam.shortcuts).to.be.a('object').and.have.property('shortcuts')
        expect(steam.skins).to.be.a('array')
        expect(steam.apps).to.be.a('array').and.have.length(2)
      } catch (err) {
        throw err
      }
    })
  })

  describe('#save', function saveDescriptor () {
    it('should save entries as requested', async function saveProperly () {
      expect(async function saveWorks () {
        await steam.save(steam.paths.config)
        await steam.save(steam.paths.libraryfolders)
        await steam.save(steam.paths.localconfig)
        await steam.save(steam.paths.registry)
        await steam.save(steam.paths.sharedconfig)
      }).to.not.throw()
    })

    it('should save multiple entries as requested', async function saveProperly () {
      expect(async function saveWorks () {
        await steam.save(steam.paths.all)
      }).to.not.throw()
    })
  })
})
