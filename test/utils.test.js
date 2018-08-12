/* eslint-env mocha */
'use strict'

const chai = require('chai')
const path = require('path')
// const fetch = require('node-fetch')
const steamUtils = require('./../src/webUtils.js')

const expect = chai.expect

const id64 = '76561198067577712'
// const accountID = '107311984'

describe('Module utils', function spDescriptor () {
  this.slow(0)
  this.timeout(6000)
  this.retries(2)

  describe('#requestOwnedApps', function reqOwnedDescriptor () {
    it('should throw for an invalid id64 @notreq', async function reqOwnedThrows () {
      try {
        await steamUtils.requestOwnedApps('', {cache: {}})

        throw new Error('Did not throw')
      } catch (err) {
        if (err.message.indexOf('Invalid id64 for requestOwnedApps')) {
          throw err
        }
      }
    })

    it('should get the owned apps from the web', async function reqOwnedWorks () {
      const owned = await steamUtils.requestOwnedApps(id64, {force: true, cache: {enabled: true, folder: path.join(__dirname, 'cache')}})

      expect(owned).to.be.a('array').and.to.have.property('length').and.to.be.above(0)
    })

    it('should get the owned apps from the cache', async function reqOwnedWorks () {
      const owned = await steamUtils.requestOwnedApps(id64, {cache: {enabled: true, folder: path.join(__dirname, 'cache')}})

      expect(owned).to.be.a('array').and.to.have.property('length').and.to.be.above(0)
    })

    it('should convert a single app to a list', async function requestOwnedAppsSingle () {
      let owned = await steamUtils.requestOwnedApps('76561198261241942', {cache: {enabled: true, folder: path.join(__dirname, 'cache')}})
      expect(owned).to.be.a('array')
      expect(owned).to.have.property('length').and.equal(1)
    })
  })

  describe('#requestGenres', function reqGenresDescriptor () {
    this.retries(0)
    it('should throw for an invalid appid @notreq', async function reqGenresThrows () {
      try {
        await steamUtils.requestGenres('', {cache: {enabled: true, folder: path.join(__dirname, 'cache')}})

        throw new Error('Did not throw')
      } catch (err) {
        if (err.message.indexOf('Invalid appid for requestGenres')) {
          throw err
        }
      }
    })

    it('should get the genres from the web', async function reqGenresWorks () {
      const genres = await steamUtils.requestGenres('218620', {force: true, cache: {enabled: true, folder: path.join(__dirname, 'cache')}})

      expect(genres).to.be.a('array').and.have.property('length').and.be.above(0)
      expect(genres[ 0 ].genres).to.be.a('array').and.include('Action')
    })

    it('should get the genres from the cache', async function reqGenresCacheWorks () {
      const genres = await steamUtils.requestGenres('218620', {cache: {enabled: true, folder: path.join(__dirname, 'cache')}})

      expect(genres).to.be.a('array').and.have.property('length').and.be.above(0)
      expect(genres[ 0 ].genres).to.be.a('array').and.include('Action')
    })
  })

  describe('#requestTags', function reqTagsDescriptor () {
    it('should get the tags from the web', async function reqTagsWorks () {
      const tags = await steamUtils.requestTags({force: true, cache: {enabled: true, folder: path.join(__dirname, 'cache')}})

      expect(tags).to.be.a('array').and.have.property('length').and.be.above(0)
    })

    it('should get the tags from the cache', async function reqTagsWorks () {
      const tags = await steamUtils.requestTags({cache: {enabled: true, folder: path.join(__dirname, 'cache')}})

      expect(tags).to.be.a('array').and.have.property('length').and.be.above(0)
    })
  })
})
