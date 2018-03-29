/* eslint-env mocha */
'use strict'

const chai = require('chai')
// const fetch = require('node-fetch')
const steamUtils = require('./../lib/steam-utils.js')

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
    it('should throw an error for invalid args', async function itThrows () {
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
    it('should request and return an array for a valid user id64', async function reqOwnedWorks () {
      const owned = await steamUtils.requestOwnedApps(id64)

      expect(owned).to.be.a('array').and.to.have.property('length').and.to.be.above(0)
    })
  })

  describe('#requestGenres', function reqGenresDescriptor () {
    it('should request and return an array for a valid appid', async function reqGenresWorks () {
      const genres = await steamUtils.requestGenres('218620')

      expect(genres).to.be.a('array').and.have.property('length').and.be.above(0)
      expect(genres[ 0 ].genres).to.include('Action')
    })
  })

  describe('#requestTags', function reqTagsDescriptor () {
    it('should request and return an array for a valid appid', async function reqTagsWorks () {
      const tags = await steamUtils.requestTags()

      expect(tags).to.be.a('array').and.have.property('length').and.be.above(0)
    })
  })
})
