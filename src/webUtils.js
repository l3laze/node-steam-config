'use strict'

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const fxp = require('fast-xml-parser')
const al = require('./asyncLib.js')

async function requestOwnedApps (id64, options) {
  if (!id64 || typeof id64 !== 'string' || /\D/.test(id64)) {
    throw new Error(`Invalid id64 for requestOwnedApps: ${id64} ${typeof id64}. Should be a number as a 'string'.`)
  }

  let data

  try {
    if (options.cache.folder === undefined) {
      options.cache.folder = __dirname
    }

    if (options.cache.file === undefined) {
      options.cache.file = `owned-${id64}.json`
    }

    const filePath = path.join(options.cache.folder, options.cache.file)

    if (fs.existsSync(options.cache.folder) && fs.existsSync(filePath)) {
      data = '' + await al.readFileAsync(filePath)
      data = JSON.parse(data)
    } else {
      data = await fetch(`https://steamcommunity.com/profiles/${id64}/games/?tab=all&xml=1`, {
        timeout: options.timeout
      })

      data = fxp.parse(await data.text()).gamesList.games.game

      if (typeof data === 'object' && data.constructor.name !== 'Array') {
        data = [data]
      }
    }
  } catch (err) {
    throw new Error(err)
  }

  return data
}

async function requestGenres (appid, options) {
  if (!appid || typeof appid !== 'string' || /\D/.test(appid)) {
    throw new Error(`Invalid appid for requestGenres: ${typeof appid}. Should be a number as a 'string'.`)
  }

  let data
  const genres = []

  try {
    if (options.cache.folder === undefined) {
      options.cache.folder = __dirname
    }

    if (options.cache.file === undefined) {
      options.cache.file = `genres.json`
    }

    const filePath = path.join(options.cache.folder, options.cache.file)

    if (options.cache.use && (fs.existsSync(options.cache.folder) && fs.existsSync(filePath))) {
      data = '' + await al.readFileAsync(filePath)
      data = JSON.parse(data)
      data = data.filter((i) => i.appid === appid)[ 0 ]
    }

    if (data === undefined) {
      data = await fetch(`https://store.steampowered.com/app/${appid}/`, {
        credentials: 'include',
        headers: {
          cookie: 'birthtime=189324001' // 1/1/1976 @ 12:00:01 AM
        },
        timeout: options.timeout
      })

      let index
      let done = false

      data = '' + await data.text()

      index = data.indexOf('<div class="details_block">')

      do {
        index = data.indexOf('https://store.steampowered.com/genre/', index) // 37 characters

        if (index === -1) {
          done = true
          break
        }

        index += 37

        genres.push(data.substring(index, data.indexOf('/', index)))
      } while (!done)
    }
  } catch (err) {
    throw new Error(err)
  }

  return [{
    appid,
    genres
  }]
}

async function requestTags (options) {
  let data

  try {
    if (options.cache.folder === undefined) {
      options.cache.folder = __dirname
    }

    if (options.cache.file === undefined) {
      options.cache.file = `tags.json`
    }

    const filePath = path.join(options.cache.folder, options.cache.file)

    if (fs.existsSync(options.cache.folder) && fs.existsSync(filePath)) {
      data = '' + await al.readFileAsync(filePath)
      data = JSON.parse(data)
    } else {
      data = await fetch('https://store.steampowered.com/tagdata/populartags/english', {
        timeout: options.timeout
      })

      data = '' + await data.text()
      data = JSON.parse(data)
    }
  } catch (err) {
    throw new Error(err)
  }

  return data
}

module.exports = {
  requestOwnedApps,
  requestGenres,
  requestTags
}
