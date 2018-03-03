/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 *
 * @requires {@link https://www.npmjs.com/package/bluebird|bluebird}
 */

'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs')) // eslint-disable-line no-unused-vars
const path = require('path') // eslint-disable-line no-unused-vars
const fetch = BB.promisifyAll(require('node-fetch'))
const FXP = require('fast-xml-parser')
const UInt64 = require('cuint').UINT64

/**
 * Internal function to get a user's account ID from their SteamID 64.
 * @name getAccountIdFromId64
 * @function
 * @param {String} id64 - The SteamID64 of the user to calculte the Steam3:accountId of.
 * @return {String} - The accountId of the user.
 * @throws {Error} - If Long has an issue with the data.
 */
exports.getAccountIdFromId64 = function getAccountIdFromId64 (id64) {
  if (typeof id64 !== 'string' || /[^\d]/.test(id64)) {
    throw new Error(`Invalid id64 for getAccountIdFromId64: ${id64} ${typeof id64}. Should be a number as a 'string'.`)
  }

  return '' + ((new UInt64(id64, 10).toNumber() & 0xFFFFFFFF) >>> 0)
}

/**
 * Request the current user's list of owned apps from store.steampowered.com.
 * @method
 * @async
 * @param {String|Number} id64 - The user id64 to get the owned apps list for.
 * @param {Boolean} force - Force to get a new copy instead of loading cached copy.
 * @param {Object} cache - Cache options (enabled, folder).
 * @returns {Array} - An Array of Objects that represent the user's owned apps.
 * @throws {Error} - If the user has not been defined yet, or there is an error reading from or writing to the cache, or there is an error loading the file from the internet, or there is an error parsing the data (XML) and converting it to JSON.
 */
exports.requestOwnedApps = async function requestOwnedApps (id64, force = false, cache = {enabled: false}) {
  if (!id64 || typeof id64 !== 'string') {
    throw new Error(`Invalid id64 for requestOwnedApps: ${id64} ${typeof id64}. Should be a number as a 'string'.`)
  }
  let rf = async () => {
    let data
    data = await fetch(`https://steamcommunity.com/profiles/${id64}/games/?tab=all&xml=1`)
    data = FXP.parse(await data.text()).gamesList.games.game

    if (typeof data === 'object' && data.constructor.name !== 'Array') {
      data = [data]
    }

    return data
  }

  let owned = await exports.requestWithCache(rf, force, {
    enabled: cache.enabled || /* istanbul ignore next */ false,
    folder: cache.folder || /* istanbul ignore next */ null,
    file: `owned-${id64}.json`
  })

  return owned
}

/**
 * Request a list of the popular tags from store.steampowered.com.
 * @method
 * @async
 * @param {Boolean} force - Force request to get a new copy instead of using a cached copy.
 * @param {Object} cache - Cache options (enabled, folder).
 * @returns {Array} - An Array of Strings that represents the popular tags on Steam.
 * @throws {Error} - If there is an error loading the tags list from the local cache or the internet.
 */
exports.requestTags = async function requestTags (/* istanbul ignore next */ force = false,  /* istanbul ignore next */ cache = {}) {
  let rf = async () => {
    let data = await fetch('https://store.steampowered.com/tagdata/populartags/english')
    return JSON.parse(await data.text())
  }

  let tags = await exports.requestWithCache(rf, force, {
    enabled: cache.enabled || /* istanbul ignore next */ false,
    folder: cache.folder || /* istanbul ignore next */ null,
    file: 'tags.json'
  })

  return tags
}

/**
 * Request (scrape) a list of the genre's of an app by it's appid from it's page on store.steampowered.com.
 * @method
 * @async
 * @param {String|Number} appid - The appid to get the genres for.
 * @param {Boolean} force - Force request to get a new copy instead of using a cached copy.
 * @param {Object} cache - Cache options (enabled, folder).
 * @returns {Array} - An Array of Strings that represent the apps genres on it's Store page.
 * @throws {Error} - If there is an error loading the page from the local cache or the internet, or scraping the internet data.
 */
exports.requestGenres = async function requestGenres (appid, /* istanbul ignore next */ force = false, /* istanbul ignore next */ cache = {}) {
  if (typeof appid !== 'string' || /[^\d]/.test(appid)) {
    throw new Error(`Invalid appid for requestGenres: ${typeof appid}. Should be a number as a 'string'.`)
  }

  let rf = async () => {
    try {
      let data
      let index
      let genres = []

      data = await fetch(`http://store.steampowered.com/app/${appid}/`, {
        credentials: 'include',
        headers: {
          cookie: 'birthtime=189324001' // 1/1/1976 @ 12:00:01 AM
        }
      })

      data = '' + await data.text()

      index = data.indexOf('<div class="details_block">')

      do {
        index = data.indexOf('http://store.steampowered.com/genre/', index) // 36 characters

        if (index === -1) {
          break
        }

        index += 36

        genres.push(data.substring(index, data.indexOf('/', index)))
      } while (true)

      return genres
    } catch (err) {
      /* istanbul ignore next */
      throw new Error(err)
    }
  }

  let data = await exports.requestWithCache(rf, force, {
    enabled: cache.enabled || /* istanbul ignore next */ false,
    folder: cache.folder || /* istanbul ignore next */ null,
    file: 'genres.json'
  })

  return data
}

exports.requestWithCache = async function requestWithCache (requestFunc, force, cache) {
  if (requestFunc.constructor.name !== 'AsyncFunction') {
    throw new Error('Invalid requestFunc for requestWithCache -- should be async, but it is not.')
  }

  let data

  try {
    if (!force && cache.enabled && cache.folder && cache.file && fs.existsSync(path.join(cache.folder, cache.file))) {
      data = JSON.parse('' + await fs.readFileAsync(path.join(cache.folder, cache.file)))
    } else {
      data = await requestFunc()

      /* istanbul ignore next */
      if (cache.folder) {
        if (!fs.existsSync(cache.folder)) {
          fs.mkdirSync(cache.folder)
        }

        await fs.writeFileAsync(path.join(cache.folder, cache.file), JSON.stringify(data, null, 2))
      }
    }
  } catch (err) {
    /* istanbul ignore next */
    throw new Error(err)
  }

  return data
}
