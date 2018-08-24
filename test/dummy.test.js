/* eslint-env mocha */
'use strict'

const fs = require('fs')
const path = require('path')
const makeDummy = require('steam-dummy')
const should = require('chai').should() // eslint-disable-line no-unused-vars
const platform = require('os').platform()
const arch = require('os').arch()
const {Registry} = require('rage-edit')

let winreg
let pathTo

if (typeof process.env.CI !== 'undefined') {
  if (platform === 'darwin') {
    pathTo = path.join(require('os').homedir(), 'Library', 'Application Support', 'Steam')
  } else if (platform === 'linux' || platform === 'android') {
    pathTo = path.join(require('os').homedir(), '.steam')
  } else if (platform === 'win32') {
    if (arch === 'ia32') {
      pathTo = path.join('C:', 'Program Files', 'Steam')
    } else {
      pathTo = path.join('C:', 'Program Files (x86)', 'Steam')
    }
  }
} else {
  pathTo = path.join(__dirname, 'Dummy')
}

describe('SteamDummy', function () {
  this.slow(0)

  describe('#makeDummy()', function () {
    it('should not create the dummy if it exists, by default', async function defaultDontCreate () {
      this.timeout(4000)

      if (typeof process.env.CI !== 'undefined') {
        if (platform === 'linux' || platform === 'darwin' || platform === 'android') {
          fs.mkdirSync(path.join(pathTo))
          fs.writeFileSync(path.join(pathTo, 'registry.vdf'), 'Hello, world!')
        } else if (platform === 'win32') {
          winreg = new Registry('HKCU\\Software\\Valve\\Steam')
          await winreg.set('AutoLoginUser', 'someusername')
        }
      }

      await makeDummy(pathTo)

      if (platform === 'linux' || platform === 'darwin' || platform === 'android') {
        fs.existsSync(path.join(pathTo, 'registry.vdf')).should.equal(true)
      } else if (platform === 'win32') {
        fs.existsSync(path.join(pathTo, 'skins', 'readme.txt')).should.equal(true)
        winreg = new Registry('HKCU\\Software\\Valve\\Steam')
        let val = await winreg.get('AutoLoginUser')
        val.should.equal('someusername')
      }
    })

    it('should create the dummy even if it exists, if using force', async function createDummyForcibly () {
      this.timeout(4000)

      await makeDummy(pathTo, { force: true })

      if (platform === 'linux' || platform === 'darwin' || platform === 'android') {
        fs.existsSync(path.join(pathTo, 'registry.vdf')).should.equal(true)
      } else if (platform === 'win32') {
        fs.existsSync(path.join(pathTo, 'skins', 'readme.txt')).should.equal(true)

        winreg = new Registry('HKCU\\Software\\Valve\\Steam')
        let val = await winreg.get('AutoLoginUser')
        val.should.equal('someusername')
      }
    })

    it(`should have created a dummy for ${platform} ${arch}`, function didMakeDummy () {
      const contents = fs.readdirSync(pathTo)

      if (platform === 'darwin') {
        contents.should.include.members([
          'External Steam Library Folder',
          'Steam.AppBundle',
          'appcache',
          'config',
          'registry.vdf',
          'steamapps',
          'userdata'
        ])
      } else if (platform === 'linux' || platform === 'android') {
        contents.should.include.members([
          'External Steam Library Folder',
          'registry.vdf',
          'skins',
          'steam'
        ])

        fs.readdirSync(path.join(pathTo, 'steam')).should.include.members([
          'appcache',
          'config',
          'steamapps',
          'userdata'
        ])
      } else if (platform === 'win32') {
        contents.should.include.members([
          'External Steam Library Folder',
          'appcache',
          'config',
          'skins',
          'steamapps',
          'userdata'
        ])
      }
    })
  })
})
