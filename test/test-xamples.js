/* eslint-env mocha */
'use strict'

const path = require('path')
const should = require('chai').should() // eslint-disable-line no-unused-vars
const spawnSync = require('child_process').spawnSync
const Dummy = require('steam-dummy')

const dummy = new Dummy()
const pathTo = path.join(__dirname, 'Dummy')

describe('./examples', function () {
  beforeEach(async function () {
    await dummy.makeDummy(pathTo, true)
  })

  describe('manager.js backup', function () {
    it('should backup the settings for a user', function () {
      const result = spawnSync('node ./examples/manager.js', ['-b'],
        {
          encoding: 'utf-8',
          shell: true
        })

      if (result.stderr) {
        throw new Error(result.stderr)
      }

      result.stdout.should.include('Backing up...')
    })
  })

  describe('switch_user.js', function () {
    it('should switch between 2 users automatically', async function () {
      const res1 = spawnSync('node ./examples/switch_user.js', [], { encoding: 'utf-8', shell: true })

      res1.stdout.should.include('Switched to ')

      const res2 = spawnSync('node ./examples/switch_user.js', [], { encoding: 'utf-8', shell: true })

      res2.stdout.should.include('Switched to ')
    })
  })

  describe('cat_man.js backup', function () {
    it('should backup the categories', async function () {
      const res1 = spawnSync('node ./examples/cat_man.js', ['-m b'], { encoding: 'utf-8', shell: true })

      if (res1.stderr) {
        throw new Error(res1.stderr)
      }

      res1.stdout.should.include(' complete.')
    })
  })

  describe('auto_cat.js add', function () {
    it('should add categories', async function () {
      const result = spawnSync('node ./examples/auto_cat.js', ['-dbmntg 2'], { encoding: 'utf-8', shell: true })

      if (result.stderr) {
        throw new Error(result.stderr)
      }

      result.stdout.should.include(' items categorized.')
    })
  })

  describe('auto_cat.js remove', function () {
    it('should remove categories', async function () {
      const result = spawnSync('node ./examples/auto_cat.js', ['-dbmntg 2 -r'], { encoding: 'utf-8', shell: true })

      if (result.stderr) {
        throw new Error(result.stderr)
      }

      result.stdout.should.include(' items categorized.')
    })
  })

  describe('cat_man.js restore', function () {
    it('should restore the categories', async function () {
      const res1 = spawnSync('node ./examples/cat_man.js', ['-m r'], { encoding: 'utf-8', shell: true })

      if (res1.stderr) {
        throw new Error(res1.stderr)
      }

      res1.stdout.should.include(' complete.')
    })
  })

  describe('manager.js restore', function () {
    it('should restore the settings for a user', function () {
      let result = spawnSync('node ./examples/manager.js', ['-r'], { encoding: 'utf-8', shell: true })

      result.status.should.equal(0)
      result.stdout.should.include('Restoring...')
      result.stdout.should.include('Finished')
    })
  })
})
