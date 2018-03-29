/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 */

'use strict'

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const FXP = require('fast-xml-parser')
const UInt64 = require('cuint').UINT64
const afs = require('./asyncLib.js')

/**
 * Internal function to get a user's account ID from their SteamID 64.
 * @name getAccountIdFromId64
 * @function
 * @param {string} id64 - The SteamID64 of the user to calculte the Steam3:accountId of.
 * @return {string} - The accountId of the user.
 * @throws {Error} - If Long has an issue with the data.
 */
function getAccountIdFromId64 (id64) {
  if (typeof id64 !== 'string' || /[^\d]/.test(id64)) {
    throw new Error(`Invalid id64 for getAccountIdFromId64: ${id64} ${typeof id64}. Should be a number as a 'string'.`)
  }

  return '' + ((new UInt64(id64, 10).toNumber() & 0xFFFFFFFF) >>> 0)
}

async function requestWithCache (requestFunc, force, cache, extra) {
  if (requestFunc.constructor.name !== 'AsyncFunction') {
    throw new Error('Invalid requestFunc for requestWithCache -- should be an AsyncFunction.')
  }

  let data

  try {
    const useCache = !force && cache.enabled && cache.folder && cache.file && fs.existsSync(path.join(cache.folder, cache.file))
    if (useCache) {
      data = JSON.parse('' + await afs.readFileAsync(path.join(cache.folder, cache.file)))
    } else {
      if (typeof extra !== 'undefined') {
        data = await requestFunc(extra)
      } else {
        data = await requestFunc()
      }

      if (cache.folder) {
        if (!fs.existsSync(cache.folder)) {
          fs.mkdirSync(cache.folder)
        }

        await afs.writeFileAsync(path.join(cache.folder, cache.file), JSON.stringify(data, null, 2))
      }
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }

  return data
}

/**
 * Request the current user's list of owned apps from store.steampowered.com.
 * @method
 * @async
 * @param {string|number} id64 - The user id64 to get the owned apps list for.
 * @param {boolean} force - Force to get a new copy instead of loading cached copy.
 * @param {Object} cache - Cache options (enabled, folder).
 * @returns {Array} - An Array of Objects that represent the user's owned apps.
 * @throws {Error} - If the user has not been defined yet, or there is an error reading from or writing to the cache, or there is an error loading the file from the internet, or there is an error parsing the data (XML) and converting it to JSON.
 */
async function requestOwnedApps (id64, force = false, cache = {enabled: false}) {
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

  let owned = await requestWithCache(rf, force, {
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
 * @param {boolean} force - Force request to get a new copy instead of using a cached copy.
 * @param {Object} cache - Cache options (enabled, folder).
 * @returns {Array} - An Array of Strings that represents the popular tags on Steam.
 * @throws {Error} - If there is an error loading the tags list from the local cache or the internet.
 */
async function requestTags (/* istanbul ignore next */ force = false, /* istanbul ignore next */ cache = {}) {
  async function reqFunc () {
    let data

    try {
      data = await fetch('https://store.steampowered.com/tagdata/populartags/english')
      data = await data.text()
      data = JSON.parse('' + data)
    } catch (err) {
      /* istanbul ignore next */
      throw err
    }

    return data
  }

  let tags

  try {
    tags = await requestWithCache(reqFunc, force, {
      enabled: cache.enabled || /* istanbul ignore next */ false,
      folder: cache.folder || /* istanbul ignore next */ null,
      file: 'tags.json'
    })
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }

  return tags
}

async function reqGenresHelper (appid) {
  let data
  const genres = []

  try {
    let index
    let done = false

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
        done = true
        break
      }

      index += 36

      genres.push(data.substring(index, data.indexOf('/', index)))
    } while (!done)
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }

  data = [{
    appid,
    genres
  }]

  return data
}

/**
 * Request (scrape) a list of the genre's of an app by it's appid from it's page on store.steampowered.com.
 * @method
 * @async
 * @param {string|number} appid - The appid to get the genres for.
 * @param {boolean} force - Force request to get a new copy instead of using a cached copy.
 * @param {Object} cache - Cache options (enabled, folder).
 * @returns {Array} - An Array of Strings that represent the apps genres on it's Store page.
 * @throws {Error} - If there is an error loading the page from the local cache or the internet, or scraping the internet data.
 */
async function requestGenres (appid, /* istanbul ignore next */ force = false, /* istanbul ignore next */ cache = {}) {
  if (typeof appid !== 'string' || /[^\d]/.test(appid)) {
    throw new Error(`Invalid appid for requestGenres: ${typeof appid}. Should be a number as a 'string'.`)
  }

  let data
  let cacheFile

  try {
    cache.file = 'genres.json'

    if (!force && cache.enabled && cache.folder && cache.file && fs.existsSync((cacheFile = path.join(cache.folder, cache.file)))) {
      data = await afs.readFileAsync(cacheFile)
      cacheFile = JSON.parse('' + data)
      data = cacheFile.filter((i) => i.appid === appid)
    }

    if (typeof data === 'undefined') {
      data = await requestWithCache(reqGenresHelper, force, {
        enabled: cache.enabled || /* istanbul ignore next */ false,
        folder: cache.folder || /* istanbul ignore next */ null,
        file: 'genres.json'
      }, appid)
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }

  return data
}

module.exports = {
  getAccountIdFromId64,
  requestGenres,
  requestOwnedApps,
  requestTags,
  requestWithCache
}
