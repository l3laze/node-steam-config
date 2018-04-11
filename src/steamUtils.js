/**
 * @module SteamUtils
 */
'use strict'

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const FXP = require('fast-xml-parser')
const UInt64 = require('cuint').UINT64
const afs = require('./asyncLib.js')

/**
 * @description Get the Steam3::account ID from a Steam ID64 value.
 * @method getAccountIdFromId64
 * @arg {Number} id64 - The id64 to get the accountId from.
 * @returns {Number} - The accountId of the id64.
 * @throws {Error} - If argument `id64` is invalid.
 * @throws {Error} - To propagate errors
 */
function getAccountIdFromId64 (id64) {
  if (typeof id64 !== 'string' || /[^\d]/.test(id64)) {
    throw new Error(`Invalid id64 for getAccountIdFromId64: ${id64} ${typeof id64}. Should be a number as a 'string'.`)
  }

  return '' + ((new UInt64(id64, 10).toNumber() & 0xFFFFFFFF) >>> 0)
}

/**
 * @description Request a webpage and optionally cache results.
 * @method requestWithCache
 * @async
 * @arg {Number} id64 - The id64 to get the accountId from.
 * @arg {Boolean} force - Force to get a fresh copy of the requested data.
 * @arg {Object} cache - An object of the format {enabled: true|false, folder: path to cache folder, file: path to cache file}
 * @arg {string} site - The site to request the data from.
 * @returns {string} - The requested data if found/received.
 * @throws {Error} - If `requestFunc` is not an async function.
 * @throws {Error} - To propagate errors
 */
async function requestWithCache (requestFunc, force, cache, site) {
  if (requestFunc.constructor.name !== 'AsyncFunction') {
    throw new Error('Invalid requestFunc for requestWithCache -- should be an AsyncFunction.')
  }

  let data

  try {
    const useCache = !force && cache.enabled && cache.folder && cache.file && fs.existsSync(path.join(cache.folder, cache.file))
    if (useCache) {
      data = JSON.parse('' + await afs.readFileAsync(path.join(cache.folder, cache.file)))
    } else {
      if (typeof site !== 'undefined') {
        data = await requestFunc(site)
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
 * @description Request the list of owned apps on Steam for a given Steam ID64.
 * @method requestOwnedApps
 * @async
 * @arg {Number} id64 - The id64 to get the accountId from.
 * @arg {Boolean} force - Force to get a fresh copy of the requested data.
 * @arg {Object} cache - An object of the format {enabled: true|false, folder: path to cache folder, file: path to cache file}
 * @returns {Array} - An array objects, each representing a single owned app for the account `id64`.
 * @throws {Error} - If argument `id64` is invalid.
 * @throws {Error} - To propagate errors
 */
async function requestOwnedApps (id64, force = false, cache = {enabled: false}) {
  if (!id64 || typeof id64 !== 'string' || /\D/.test(id64)) {
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
 * @description Request the list of popular tags on Steam.
 * @method requestTags
 * @async
 * @arg {Boolean} force - Force to get a fresh copy of the requested data.
 * @arg {Object} cache - An object of the format {enabled: true|false, folder: path to cache folder, file: path to cache file}
 * @returns {Array} - An array of key: val pairs of tag names and their ID's.
 * @throws {Error} - To propagate errors.
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
 * @description Request the list of genres for an app on Steam.
 * @method requestGenres
 * @async
 * @arg {Number} appid - The Steam appid of the app to request genres for.
 * @arg {Boolean} force - Force to get a fresh copy of the requested data.
 * @arg {Object} cache - An object of the format {enabled: true|false, folder: path to cache folder, file: path to cache file}
 * @returns {Array} - The genres from the app's Steam store page.
 * @throws {Error} - If argument `appid` is invalid.
 * @throws {Error} - To propagate errors
 */
async function requestGenres (appid, /* istanbul ignore next */ force = false, /* istanbul ignore next */ cache = {}) {
  if (!appid || typeof appid !== 'string' || /\D/.test(appid)) {
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
