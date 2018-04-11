/* eslint-env mocha */
'use strict'

const chai = require('chai')
const path = require('path')
// const fetch = require('node-fetch')
const steamUtils = require('./../src/steamUtils.js')

const expect = chai.expect

const id64 = '76561198067577712'
const accountID = '107311984'

describe('Module utils', function spDescriptor () {
  this.slow(0)
  this.timeout(6000)
  this.retries(2)

  describe('#getAccountIdFromId64 @notreq', function () {
    it('should return a Steam3::account ID given an id64', function () {
      expect(steamUtils.getAccountIdFromId64(id64)).to.equal(accountID)
    })

    it('should throw an error for an invalid value', function () {
      expect(() => {
        steamUtils.getAccountIdFromId64('someusernmae' + id64)
      }).to.throw()
    })
  })

  describe('#requestWithCache @notreq', function reqWithDescriptor () {
    it('should throw an error for invalid args', async function reqWithThrows () {
      try {
        await steamUtils.requestWithCache(() => {}, false, {})

        throw new Error('Did not throw')
      } catch (err) {
        if (err.message.indexOf('Invalid requestFunc for requestWithCache -- should be an AsyncFunction')) {
          throw err
        }
      }
    })
  })

  describe('#requestOwnedApps', function reqOwnedDescriptor () {
    it('should throw for an invalid id64', async function reqOwnedThrows () {
      try {
        await steamUtils.requestOwnedApps('', false, {})

        throw new Error('Did not throw')
      } catch (err) {
        if (err.message.indexOf('Invalid id64 for requestOwnedApps')) {
          throw err
        }
      }
    })

    it('should get the owned apps without using the cache', async function reqOwnedWorks () {
      const owned = await steamUtils.requestOwnedApps(id64, true, {enabled: true, folder: path.join(__dirname, 'cache')})

      expect(owned).to.be.a('array').and.to.have.property('length').and.to.be.above(0)
    })

    it('should get the owned apps from the cache', async function reqOwnedWorks () {
      const owned = await steamUtils.requestOwnedApps(id64, false, {enabled: true, folder: path.join(__dirname, 'cache')})

      expect(owned).to.be.a('array').and.to.have.property('length').and.to.be.above(0)
    })

    it('should convert a single app to a list with a single entry', async function requestOwnedAppsSingle () {
      let owned = await steamUtils.requestOwnedApps('76561198261241942', true, {enabled: true, folder: path.join(__dirname, 'cache')})
      expect(owned).to.be.a('array')
      expect(owned).to.have.property('length').and.equal(1)
    })
  })

  describe('#requestGenres', function reqGenresDescriptor () {
    it('should throw for an invalid appid', async function reqGenresThrows () {
      try {
        await steamUtils.requestGenres('', false, {enabled: true, folder: path.join(__dirname, 'cache')})

        throw new Error('Did not throw')
      } catch (err) {
        if (err.message.indexOf('Invalid appid for requestGenres')) {
          throw err
        }
      }
    })

    it('should request and return an array for a valid appid', async function reqGenresWorks () {
      const genres = await steamUtils.requestGenres('218620', true, {enabled: true, folder: path.join(__dirname, 'cache')})

      expect(genres).to.be.a('array').and.have.property('length').and.be.above(0)
      expect(genres[ 0 ].genres).to.include('Action')
    })

    it('should get the genres from the cache', async function reqGenresCacheWorks () {
      const genres = await steamUtils.requestGenres('218620', false, {enabled: true, folder: path.join(__dirname, 'cache')})

      expect(genres).to.be.a('array').and.have.property('length').and.be.above(0)
      expect(genres[ 0 ].genres).to.include('Action')
    })
  })

  describe('#requestTags', function reqTagsDescriptor () {
    it('should request and return an array for a valid appid', async function reqTagsWorks () {
      const tags = await steamUtils.requestTags(true, {enabled: true, folder: path.join(__dirname, 'cache')})

      expect(tags).to.be.a('array').and.have.property('length').and.be.above(0)
    })
  })
})
