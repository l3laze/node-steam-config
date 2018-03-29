/* eslint-env mocha */
'use strict'

const path = require('path')
const expect = require('chai').expect
const makeDummy = require('steam-dummy')
const steam = require('./../lib/index.js')

const home = require('os').homedir()
const platform = require('os').platform()
const arch = require('os').arch()
const pathTo = path.join(__dirname, 'Dummy')
const id64 = '76561198067577712'
const accountID = '107311984'

describe('Module SteamConfig @notreq', function moduleDescriptor () {
  this.slow(0)

  before(async function initDummy () {
    await makeDummy(pathTo)
  })

  it('should be initialized by require\'ing it', function initsOnReq () {
    expect(steam).to.have.property('paths').and.have.property('root')
    steam.paths.root = pathTo
    steam.paths.id64 = id64
    steam.paths.account = accountID
  })

  describe('#load', function loadDescriptor () {
    this.timeout(4000)

    it('should load single files as requested', async function loadProperly () {
      await steam.load(steam.paths.appinfo)
      expect(steam.appinfo).to.be.a('array')

      await steam.load(steam.paths.config)
      expect(steam.config).to.be.a('object')
      expect(steam.config.InstallConfigStore).to.have.property('Software')
        .and.have.property('Valve')
        .and.have.property('Steam')
        .and.have.property('Accounts')
      expect(steam.config.InstallConfigStore).to.not.have.property('DownloadRates')
      expect(steam.config.InstallConfigStore.Software.Valve.Steam).to.not.have.property('')

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

    it('should load more steamapps as requested', async function loadMoreApps () {
      let externalLib

      for (let k of Object.keys(steam.libraryfolders.LibraryFolders)) {
        if (k !== 'ContentStatsID' && k !== 'TimeNextStatsReport') {
          steam.libraryfolders.LibraryFolders[ k ] = path.join(pathTo, 'External Steam Library Folder')
          externalLib = steam.libraryfolders.LibraryFolders[ k ]
        }
      }

      await steam.load(steam.paths.steamapps(externalLib))
      expect(steam.apps).to.be.a('array').and.have.property('length').and.equal(4)
    })

    it('should load all files as requested', async function loadProperly () {
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
    it('should save files as requested', async function saveProperly () {
      expect(async function saveWorks () {
        await steam.save(steam.paths.config)
        await steam.save(steam.paths.libraryfolders)
        await steam.save(steam.paths.localconfig)
        await steam.save(steam.paths.registry)
        await steam.save(steam.paths.sharedconfig)
      }).to.not.throw()
    })
  })

  describe('#detectRoot', function detectUserDescriptor () {
    it('should detect the root', async function detectsRoot () {
      const rp = await steam.detectRoot()

      if (platform === 'linux') {
        expect(rp).to.equal(path.join(home, '.steam'))
      } else if (platform === 'darwin') {
        expect(rp).to.equal(path.join(home, 'Library', 'Application Support', 'Steam'))
      } else if (platform === 'win32') {
        if (arch === 'ia32') {
          expect(rp).to.equal(path.join('C:', 'Program Files', 'Steam'))
        } else if (arch === 'ia64') {
          expect(rp).to.equal(path.join('C:', 'Program Files (x86)', 'Steam'))
        }
      }
    })
  })

  describe('#detectUser', function detectUserDescriptor () {
    it('should detect the user', async function detectUser () {
      const user = await steam.detectUser()

      expect(user.id64).to.equal('76561198067577712')
      expect(user.accountId).to.equal('107311984')
    })
  })
})
