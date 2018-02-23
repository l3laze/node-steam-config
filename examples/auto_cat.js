'use strict'

// const fs = require('fs')
// const path = require('path')
const SteamConfig = require('../index.js')
const BB = require('bluebird')
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const cli = require('cli')

const requestOwnedApps = require('../steamdata-utils.js').requestOwnedApps
const requestTags = require('../steamdata-utils.js').requestTags
const requestGenres = require('../steamata-utils.js').requestGenres

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  path: ['p', 'Path to Steam installation.', 'path', null],
  user: ['u', 'User to auto-categorize games for.', 'string', null],
  dev: ['d', 'Add name of developer as a category', 'boolean', false],
  pub: ['b', 'Add name of publisher as a category', 'boolean', false],
  meta: ['m', 'Add metacritic score as a category', 'boolean', false],
  noMeta: ['n', 'Add games without a metacritic score to a "No Metacritic" category', 'boolean', false],
  tags: ['t', 'Categorize by popular tags', 'boolean', false],
  numTags: ['g', 'Number of tags to use', 'number', 1],
  remove: ['r', 'Remove instead of add', 'boolean', false]
})

let steam = new SteamConfig()

let tagList

async function run () {
  let user = {}
  let gamesList = null

  if (options.path === null) {
    steam.detectRoot(true)
    console.info('Trying to find default path to Steam...')

    if (!steam.paths.rootPath) {
      process.error('Couldn\'t find default path to Steam.')
      process.exit(1)
    }
  }

  await steam.load([steam.paths.registry, steam.paths.loginusers])

  let userKeys = Object.keys(steam.loginusers.users)

  if (options.user === null) {
    try {
      options.user = steam.detectUser(true)
    } catch (err) {
      if (err.message.indexOf('cannot auto-detect') !== -1 || err.message.indexOf('no users') !== -1) {
        console.error(err.message)
        process.exit(1)
      } else {
        console.error(err)
        process.exit(1)
      }
    }
  }

  for (let i = 0; i < userKeys.length; i += 1) {
    if (steam.loginusers.users[userKeys[ i ]].AccountName === options.user || steam.loginusers.users[userKeys[ i ]].PersonaName === options.user) {
      console.info(`User: ${steam.loginusers.users[userKeys[ i ]].PersonaName}`)
      user = Object.assign({}, steam.loginusers.users[userKeys[ i ]])
      options.user = '' + user.AccountName
    }
  }

  if (user === '') {
    console.error('No user set.')
    process.exit(1)
  }

  try {
    requestTags(false, {
      enabled: true,
      folder: path.join(__dirname, 'data')
    })

    requestGames(false, {
      enabled: true,
      folder: path.join(__dirnamae, 'data')
    })
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  console.info(`${gamesList.length} games`)
  console.info(`${tagList.length} tags`)

  let hasOption = false
  let mode = (options.remove === false ? 'Adding' : 'Removing')

  if (options.pub) {
    hasOption = true
    console.info(`${mode} publisher as category...`)
  }

  if (options.dev) {
    hasOption = true
    console.info(`${mode} developer as category...`)
  }

  if (options.meta) {
    hasOption = true
    console.info(`${mode} metacritic score as category...`)
  }

  if (options.noMeta) {
    hasOption = true
    console.info(`${mode} "No Metacritic" as category...`)
  }

  if (options.tags) {
    hasOption = true
    console.info(`${mode} ${options.numTags} most popular tags as categories...`)
  }

  if (hasOption === false) {
    console.info('You didn\'t specify any options...nothing to do!')
    process.exit(0)
  }

  try {
    for (let i = 0; i < gamesList.length; i += 1) {
      let app
      let info = getAppInfo(gamesList[ i ].appID)

      if (steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps.hasOwnProperty(gamesList[ i ].appID) === false) {
        app = {
          'tags': {}
        }
      } else {
        app = Object.assign({}, steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ gamesList[ i ].appID ])
      }

      if (options.pub && !options.remove && info.entries.hasOwnProperty('extended') && info.entries.extended.hasOwnProperty('publisher')) {
        app = addCat(app, info.entries.extended.publisher.trim())
      } else if (options.remove && info.entries.hasOwnProperty('extended') && info.entries.extended.hasOwnProperty('publisher')) {
        app = removeCat(app, info.entries.extended.publisher.trim())
      }

      if (options.dev && !options.remove && info.entries.hasOwnProperty('extended') && info.entries.extended.hasOwnProperty('developer')) {
        app = addCat(app, info.entries.extended.developer.trim())
      } else if (options.remove && info.entries.hasOwnProperty('extended') && info.entries.extended.hasOwnProperty('developer')) {
        app = removeCat(app, info.entries.extended.developer.trim())
      }

      if (options.meta) {
        if (info.entries.hasOwnProperty('common') && info.entries.common.hasOwnProperty('metacritic_score')) {
          if (!options.remove) {
            app = addCat(app, ('' + info.entries.common.metacritic_score).trim())
          } else {
            app = removeCat(app, ('' + info.entries.common.metacritic_score).trim())
          }
        } else if (options.noMeta && !options.remove) {
          app = addCat(app, 'No metacritic')
        } else if (options.noMeta && options.remove) {
          app = removeCat(app, 'No metacritic')
        }
      }

      if (options.tags && info.entries.hasOwnProperty('common') && info.entries.common.hasOwnProperty('store_tags')) {
        let keys = Object.keys(info.entries.common.store_tags)
        let x

        for (x = 0; x < options.numTags && x < keys.length; x += 1) {
          let tag = getTagById(info.entries.common.store_tags[keys[ x ]])
          if (options.remove) {
            app = removeCat(app, tag.trim())
          } else {
            app = addCat(app, tag.trim())
          }
        }
      }

      if (JSON.stringify(app.tags) !== '{}' && steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps.hasOwnProperty(gamesList[ i ].appID) === false) {
        steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[gamesList[ i ].appID] = app
      } else {
        if (JSON.stringify(app.tags) === '{}') {
          delete steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[gamesList[ i ].appID]
        } else {
          steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[gamesList[ i ].appID].tags = app.tags
        }
      }
    }

    if (steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps) {
      console.info(`${Object.keys(steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps).length} items categorized.`)
    } else {
      console.info(`No 'Apps' data.`)
    }

    steam.saveTextVDF(steam.getPathTo('sharedconfig'), steam.sharedconfig)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

function getAppInfo (appid) {
  for (let i = 0; i < steam.appinfo.length; i += 1) {
    if (steam.appinfo[ i ].id === appid) {
      return steam.appinfo[ i ]
    }
  }

  return {}
}

function getTagById (id) {
  for (let i = 0; i < tagList.length; i += 1) {
    if (tagList[ i ].tagid === id) {
      return tagList[ i ].name
    }
  }

  throw new Error(`Unknown tag for getTagById: ${id}.`)
}

function addCat (app, cat) {
  let cats = Object.values(app.tags)
  let index = cats.length || 0

  if (cats.includes(cat) === false) {
    app.tags[ index ] = cat
  }

  return app
}

function removeCat (app, cat) {
  let newTags = 0
  let keys = Object.keys(app.tags)
  let removed = {
    'tags': {}
  }

  for (let i = 0; i < keys.length; i += 1) {
    if (app.tags[keys[ i ]].trim() !== cat) {
      removed.tags[ newTags ] = app.tags[keys[ i ]].trim()
      newTags += 1
    }
  }

  return removed
}

run()
