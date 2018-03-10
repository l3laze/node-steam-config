'use strict'

const fs = require('fs')
const path = require('path')
const SteamConfig = require('../lib/index.js')
const cli = require('cli')

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  path: ['p', 'Path to Steam installation.', 'path', null],
  user: ['u', 'User to backup/restore categories for.', 'string', null],
  mode: ['m', 'Mode: (b)ackup or (r)estore.', 'string', null]
})

let steam = new SteamConfig()

if (options.path && !fs.existsSync(options.path)) {
  console.error(`Bad path -- Can't find part/all of ${options.path}`)
  process.exit(1)
} else if (options.mode === null) {
  console.error(`No mode set -- can't run without a mode.`)
  process.exit(1)
}

async function backupCats () {
  let apps = []
  let appKeys = []
  let cats = {}
  let tags = []
  let catted = 0
  let hidden = 0
  let fav = 0

  await steam.load(steam.paths.sharedconfig)
  Object.assign(apps, steam.loginusers.users[ steam.paths.id64 ].sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)
  Object.assign(appKeys, Object.keys(apps))

  Object.keys(apps).forEach(function (app) {
    let props = Object.getOwnPropertyNames(apps[ app ])

    props.forEach(function (prop) {
      if (prop !== 'tags' && prop !== 'Hidden') {
        delete apps[ app ][ prop ]
      } else if (prop === 'tags') {
        Object.values(apps[ app ][ prop ]).forEach(function (t) {
          if (t === 'favorite') {
            fav += 1
          } else if (!tags.includes(t)) {
            tags.push(t)
          }
        })
        catted += 1
      } else if (prop === 'Hidden') {
        hidden += 1
      }

      cats[ `${app}` ] = apps[ app ]
    })
  })

  console.info(`App Entriess:\t${appKeys.length}`)
  console.info(`Hidden:\t\t${hidden}`)
  console.info(`Categorized:\t${catted}`)
  console.info(`Favorites:\t${fav}`)
  console.info(`Categories:\t${tags.length}`)

  await fs.writeFileSync(path.join(__dirname, 'data', `catbackup-${steam.currentUser.id64}.json`), JSON.stringify(cats, null, 2))
}

async function restoreCats () {
  let backupFile = path.join(__dirname, 'data', `catbackup-${steam.currentUser.id64}.json`)
  let backCats
  let scApps
  let original = {}
  let modified = {}

  if (!fs.existsSync(backupFile)) {
    throw new Error(`There is no backup to restore from for ${steam.currentUser.id64}.`)
  }

  await steam.load(steam.paths.sharedconfig)

  backCats = JSON.parse('' + fs.readFileSync(backupFile))
  scApps = Object.keys(steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)

  Object.assign(original, steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig)

  Object.keys(backCats).forEach(function (appid) {
    if (scApps.includes(appid) === false) {
      steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ] = {}
    }

    if (backCats[ appid ].tags) {
      steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ].tags = backCats[ appid ].tags
    }

    if (backCats[ appid ].Hidden) {
      steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ].Hidden = backCats[ appid ].Hidden
    }
  })

  Object.assign(modified, steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig)

  console.info(`${Object.keys(steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps).length} items categorized.`)

  await steam.save(steam.paths.sharedconfig)
}

async function run () {
  try {
    if (!options.path) {
      console.info('No path set; trying to find default...')
      steam.detectRoot(true)
    } else {
      steam.setRoot(options.path)
    }

    if (options.mode === 'b') {
      options.mode = 'backup'
    } else if (options.mode === 'r') {
      options.mode = 'restore'
    } else if (options.mode !== 'backup' && options.mode !== 'restore') {
      throw new Error(`Invalid mode: ${options.mode}; should be 'b', 'backup', 'r', or 'restore'.`)
    }

    if (!steam.paths.rootPath) {
      console.error('Could not find default path to Steam.')
    }

    await steam.load([steam.paths.registry, steam.paths.loginusers])

    if (options.user) {
      steam.setUser(options.user)
    } else {
      steam.detectUser(true)
    }

    steam.paths.id64 = steam.currentUser.id64
    steam.paths.accountId = steam.currentUser.accountId

    if (!steam.currentUser) {
      console.error(`There are no users associated with the Steam installation at ${steam.paths.rootPath}`)
      process.exit(1)
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  if (options.mode === 'backup') {
    await backupCats()
  } else if (options.mode === 'restore') {
    await restoreCats()
  }

  if (options.mode) {
    let splitArgs = options.mode.split('')

    console.info(`...${splitArgs[ 0 ].toUpperCase() + splitArgs.splice(1, splitArgs.length).join('').toLowerCase()} complete.`)
  }
}

try {
  run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
