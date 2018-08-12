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

    if (options.cache.enabled && !options.force && fs.existsSync(options.cache.folder) && fs.existsSync(filePath)) {
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

      if (options.cache.enabled) {
        if (!fs.existsSync(options.cache.folder)) {
          await al.mkdirpAsync(options.cache.folder)
        }

        await al.writeFileAsync(filePath, JSON.stringify(data, null, 2))
      }
    }
  } catch (err) {
    throw err
  }

  return data
}

async function extract (data, options) {
  const tmp = {start: 0, end: 0}

  if (options.inclusive === undefined) {
    options.inclusive = false
  }

  tmp.start = data.indexOf(options.start)

  if (tmp.start === -1) {
    tmp.start = 0
  }

  if (options.inclusive === false) {
    tmp.start += options.start.length
  }

  tmp.end = data.indexOf(options.end, tmp.start)

  if (tmp.end === -1) {
    tmp.end = 0
  }

  if (options.inclusive) {
    tmp.end += options.end.length
  }

  return data.substring(tmp.start, tmp.end)
}

async function requestGenres (appid, options) {
  if (!appid || typeof appid !== 'string' || /\D/.test(appid)) {
    throw new Error(`Invalid appid for requestGenres: ${typeof appid}. Should be a number as a 'string'.`)
  }

  if (options.force === undefined) {
    options.force = false
  }

  let data

  try {
    if (options.cache.folder === undefined) {
      options.cache.folder = __dirname
    }

    if (options.cache.file === undefined) {
      options.cache.file = `genres.json`
    }

    const filePath = path.join(options.cache.folder, options.cache.file)
    const cacheExists = fs.existsSync(options.cache.folder) && fs.existsSync(filePath)
    let fileData

    if (cacheExists) {
      fileData = JSON.parse('' + await al.readFileAsync(filePath))
    }

    if (options.cache.enabled && !options.force && cacheExists) {
      data = fileData.filter((i) => i.appid === appid)[ 0 ].genres
    }

    if (options.force || data === undefined) {
      data = await fetch(`https://store.steampowered.com/app/${appid}/`, {
        credentials: 'include',
        headers: {
          cookie: 'birthtime=189324001' // 1/1/1976 @ 12:00:01 AM
        },
        timeout: options.timeout
      })

      data = '' + await data.text()

      data = await extract(data, {start: '<b>Genre:</b>', end: '<b>Developer:</b>'})

      data = data.split('\n')
        .filter((g) => g.trim() !== '')[ 0 ] // Remove lines full of whitespace
        .split(', ') // Split up "list"
        .map((g) => { // Parse genre link text
          let start = g.indexOf('">')

          if (start !== -1) {
            start += 2
          }

          return g.substring(start, g.indexOf('</a', start))
        })

      if (options.cache.enabled) {
        if (!fs.existsSync(options.cache.folder)) {
          await al.mkdirpAsync(options.cache.folder)
        }

        if (fileData !== undefined) {
          let entry

          for (entry in fileData) {
            if (fileData[ entry ].appid === appid) {
              fileData[ entry ] = {
                appid: appid,
                genres: data
              }

              break
            }
          }

          if (fileData[ entry ].appid !== appid) {
            fileData.push({
              appid: appid,
              genres: data
            })
          }
        } else {
          fileData = [{
            appid: appid,
            genres: data
          }]
        }

        await al.writeFileAsync(filePath, JSON.stringify(fileData, null, 2))
      }
    }

    return [{
      appid,
      genres: data
    }]
  } catch (err) {
    throw err
  }
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

    if (options.cache.enabled && !options.force && fs.existsSync(options.cache.folder) && fs.existsSync(filePath)) {
      data = '' + await al.readFileAsync(filePath)
      data = JSON.parse(data)
    } else {
      data = await fetch('https://store.steampowered.com/tagdata/populartags/english', {
        timeout: options.timeout
      })

      data = '' + await data.text()
      data = JSON.parse(data)

      if (options.cache.enabled) {
        if (!fs.existsSync(options.cache.folder)) {
          await al.mkdirpAsync(options.cache.folder)
        }

        await al.writeFileAsync(filePath, JSON.stringify(data, null, 2))
      }
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
