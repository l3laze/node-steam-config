'use strict'

// const fs = require('fs')
// const path = require('path')
const path = require('path')
const cli = require('cli')
const dp = require('dot-property')
const steam = require('../src/index.js')
const steamUtils = require('../src/steamUtils.js')
// const requestGenres = require('../steamdata-utils.js').requestGenres

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  steam: ['s', 'Path to Steam installation.', 'path', undefined],
  user: ['u', 'User to auto-categorize games for.', 'string', undefined],
  dev: ['d', 'Add name of developer as a category', 'boolean', false],
  pub: ['p', 'Add name of publisher as a category', 'boolean', false],
  meta: ['m', 'Add metacritic score as a category', 'boolean', false],
  noMeta: ['n', 'Add games without a metacritic score to a "No Metacritic" category', 'boolean', false],
  tags: ['t', 'Categorize by popular tags', 'boolean', false],
  numTags: ['g', 'Number of tags to use', 'number', 1],
  remove: ['r', 'Remove instead of add', 'boolean', false]
})

function getAppInfo (appid) {
  for (let i = 0; i < steam.appinfo.length; i += 1) {
    if (steam.appinfo[ i ].id === appid) {
      return steam.appinfo[ i ]
    }
  }

  return {}
}

function getTagById (id) {
  for (let i = 0; i < steam.tags.length; i += 1) {
    if (steam.tags[ i ].tagid === id) {
      return steam.tags[ i ].name
    }
  }

  throw new Error(`Unknown tag for getTagById: ${id}.`)
}

function addCat (app, cat) {
  let cats
  let index

  if (!app.tags) {
    app.tags = {}
  }
  cats = Object.values(app.tags)
  index = cats.length || 0

  if (cats.includes(cat) === false) {
    app.tags[ index ] = cat
  }

  return app
}

function removeCat (app, cat) {
  if (!app.tags) {
    return app
  }

  let cats = Object.values(app.tags)

  if (cats.includes(cat)) {
    cats.splice(cats.indexOf(cat), 1)

    app.tags = {}

    cats.forEach((c, i) => {
      app.tags[ i ] = c
    })
  }

  return app
}

function tagEm (apps, owned, tags, options) {
  let app
  let info
  let tagged = {}

  const [ mode, fnCat ] = !options.remove ? [ 'Adding', addCat ] : [ 'Removing', removeCat ]

  console.info(`${mode}, ${options.pub ? 'publisher,' : ''} ${options.dev ? 'developer,' : ''} ${options.meta ? 'metacritic score,' : ''} ${options.noMeta ? 'no meta critic score,' : ''} ${options.tags ? (options.numTags ? options.numTags : 1) + ' most popular tags' : ''}`)

  try {
    owned.forEach((i) => {
      app = apps[ i.appID ] || {}
      info = getAppInfo(i.appID)

      if (options.pub && dp.has(info, 'entries.extended.publisher')) {
        app = fnCat(app, '' + info.entries.extended.publisher)
      }

      if (options.dev && dp.has(info, 'entries.extended.developer')) {
        app = fnCat(app, '' + info.entries.extended.developer)
      }

      if (options.meta && dp.has(info, 'entries.common.metacritic_score')) {
        app = fnCat(app, '' + info.entries.common.metacritic_score)
      }

      if (options.noMeta && !dp.has(info, 'entries.common.metacritic_score')) {
        app = fnCat(app, 'No Metacritic')
      }

      if (options.tags && dp.has(info, 'entries.common.store_tags')) {
        let keys = Object.keys(info.entries.common.store_tags) || []
        let x

        for (x = 0; x < options.numTags && x < keys.length; x += 1) {
          let tag = getTagById(info.entries.common.store_tags[keys[ x ]])
          app = fnCat(app, tag.trim())
        }
      }

      if (JSON.stringify(app.tags) === '{}') {
        delete app.tags
      }

      if (JSON.stringify(app) !== '{}') {
        tagged[ i.appID ] = app
      }

      delete apps[ i.appID ]
    })

    /* Include already-tagged non-apps (packages) */
    Object.keys(apps).forEach((i) => {
      if (!tagged[ i ]) {
        tagged[ i ] = apps[ i ]
      }
    })
  } catch (err) {
    throw err
  }

  return tagged
}

async function run () {
  try {
    if (!options.steam) {
      await steam.detectRoot(true)
      options.steam = steam.paths.rootPath
    } else {
      options.steam = path.join(options.steam.replace(/(\.\/)/, `${__dirname}/`))

      await steam.setRoot(options.steam)
    }

    await steam.load(steam.paths.registry, steam.paths.loginusers)

    if (!options.user) {
      await steam.detectUser(true)
      options.user = steam.paths.id64
    } else {
      await steam.setUser(options.user)
    }

    await steam.load(steam.paths.sharedconfig, steam.paths.appinfo)

    const owned = await steamUtils.requestOwnedApps(steam.paths.id64, false, {
      enabled: true,
      folder: path.join(__dirname, 'data')
    })

    const tags = await steamUtils.requestTags(false, {
      enabled: true,
      folder: path.join(__dirname, 'data')
    })

    steam.tags = tags

    let sc = Object.assign({}, steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)

    if (options.remove) {
      sc = tagEm(sc, owned, tags, options)
    } else {
      sc = tagEm(sc, owned, tags, options)
    }

    steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps = Object.assign({}, sc)

    console.info(Object.keys(sc).length, 'items categorized')

    await steam.save(steam.paths.sharedconfig)
  } catch (err) {
    throw err
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
