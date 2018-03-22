/* eslint-env mocha */
'use strict'

const path = require('path')
const chai = require('chai')

const requestWithCache = require('../lib/steamdata-utils.js').requestWithCache
const requestTags = require('../lib/steamdata-utils.js').requestTags
const requestGenres = require('../lib/steamdata-utils.js').requestGenres
const requestOwnedApps = require('../lib/steamdata-utils.js').requestOwnedApps
const getAccountIdFromId64 = require('../lib/steamdata-utils.js').getAccountIdFromId64

const expect = chai.expect

describe('steamdata-utils', function () {
  describe('#getAccountIdFromId64', function () {
    it('should throw an error for an invalid argument', function getAccountIdInvalid () {
      try {
        getAccountIdFromId64('{user: "8675309"}')

        throw new Error('did not fail')
      } catch (err) {
        if (err.message.indexOf('Invalid id64 for getAccountIdFromId64') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should return a string for a valid argument', function getAccountIdValid () {
      expect(getAccountIdFromId64('76561198067577712')).to.be.a('string').and.equal('107311984')
    })
  })

  describe('#requestWithCache', function () {
    it('should throw an error for an invalid function arg', async function () {
      try {
        await requestWithCache(function () {
          console.info('Hi')
        }, false, {})
      } catch (err) {
        if (err.message.indexOf('Invalid requestFunc for requestWithCache') === -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#requestTags', function () {
    this.timeout(4000)

    it('should get the array of tags from the internet and cache it', async function requestTagsValid () {
      let tags = await requestTags(true, {enabled: true, folder: path.join(__dirname, 'data')})
      expect(tags).to.be.a('array')
    })

    it('should get the array of tags from the cache', async function requestTagsValid () {
      let tags = await requestTags(false, {enabled: true, folder: path.join(__dirname, 'data')})
      expect(tags).to.be.a('array')
    })
  })

  describe('#requestGenres', function () {
    this.timeout(4000)

    it('should throw an error for an invalid argument', async function requestGenresInvalid () {
      try {
        await requestGenres({user: '8675309'})

        throw new Error('did not fail')
      } catch (err) {
        if (err.message.indexOf('Invalid appid for requestGenres') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should get the genres for a valid argument from the internet and cache them', async function requestGenresInvalid () {
      let genres = await requestGenres('218620', true, {enabled: true, folder: path.join(__dirname, 'data')})
      expect(genres).to.be.a('array')
      expect(genres[ 0 ]).to.have.property('appid').and.equal('218620')
    })

    it('should get the genres for a valid argument from the cache', async function requestGenresInvalid () {
      let genres = await requestGenres('218620', false, {enabled: true, folder: path.join(__dirname, 'data')})
      expect(genres).to.be.a('array')
      expect(genres[ 0 ]).to.have.property('appid').equal('218620')
    })
  })

  describe('#requestOwnedApps', function () {
    this.timeout(4000)

    it('should throw an error for an invalid argument', async function requestOwnedAppsInvalid () {
      try {
        await requestOwnedApps({user: '8675309'})

        throw new Error('did not fail')
      } catch (err) {
        if (err.message.indexOf('Invalid id64 for requestOwnedApps') === -1) {
          throw new Error(err)
        }
      }
    })

    it('should get the list of owned apps from the internet and cache them', async function requestOwnedAppsValid () {
      this.retries(2)
      let owned = await requestOwnedApps('76561198067577712', true, {enabled: true, folder: path.join(__dirname, 'data')}).catch((err) => {
        throw err
      })
      expect(owned).length.to.not.equal(0)
    })

    it('should get the list of owned apps from the cache', async function requestOwnedAppsAllowCache () {
      let owned = await requestOwnedApps('76561198067577712', false, {enabled: true, folder: path.join(__dirname, 'data')})
      expect(owned).length.to.not.equal(0)
    })

    it('should convert a single app to a list with a single entry', async function requestOwnedAppsSingle () {
      let owned = await requestOwnedApps('76561198261241942', true, {enabled: true, folder: path.join(__dirname, 'data')})
      expect(owned).to.be.a('array')
      expect(owned).to.have.property('length').and.equal(1)
    })
  })
})
