'use strict'

const fs = require('fs')
const path = require('path')
const SteamConfig = require('../index.js')
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

  await steam.loadSharedconfig()
  Object.assign(apps, steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)
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
  console.info(`Categories:\t${tags.length}\t${tags.join(', ')}`)

  await fs.writeFileSync(path.join(__dirname, 'data', 'catbackup.json'), JSON.stringify(cats, null, 2))
}

async function restoreCats () {
  let backCats = JSON.parse('' + fs.readFileSync(path.join(__dirname, 'data', 'catbackup.json')))
  await steam.loadSharedconfig()
  let scApps = Object.keys(steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)
  let original = {}
  let modified = {}

  Object.assign(original, steam.sharedconfig)

  Object.keys(backCats).forEach(function (appid) {
    if (scApps.includes(appid) === false) {
      steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ] = {}
    }

    if (backCats[ appid ].tags) {
      steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ].tags = backCats[ appid ].tags
    }

    if (backCats[ appid ].Hidden) {
      steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ].Hidden = backCats[ appid ].Hidden
    }
  })

  Object.assign(modified, steam.sharedconfig)

  if (JSON.stringify(original) === JSON.stringify(modified)) {
    console.debug('Restored version is okay')
  }

  await steam.saveTextVDF(path.join(steam.loc, 'userdata', steam.user.accountID, '7', 'remote', 'sharedconfig.vdf'), steam.sharedconfig)
}

async function run () {
  let installPath = null

  try {
    if (!options.path) {
      console.info('No path set; trying to find default...')
      installPath = steam.detectPath()
    } else {
      installPath = options.path
    }

    if (options.mode === 'b') {
      options.mode = 'backup'
    } else if (options.mode === 'r') {
      options.mode = 'restore'
    } else if (options.mode !== 'backup' && options.mode !== 'restore') {
      throw new Error(`Invalid mode: ${options.mode}; should be 'b', 'backup', 'r', or 'restore'.`)
    }

    if (typeof installPath === 'string') {
      console.info(`Path: ${installPath}`)
      steam.setInstallPath(installPath)
    } else {
      console.error('Couldn\'t find default path to Steam.')
      process.exit(1)
    }
    await steam.loadRegistry()
    await steam.loadLoginusers()

    if (options.user) {
      steam.setUser(options.user)
    } else {
      steam.setUser(await steam.detectUser())
    }

    if (steam.user === null) {
      console.error(`Error: No user associated with the Steam installation @ ${steam.loc}`)
      process.exit(1)
    }
  } catch (err) {
    console.error(err.message)
    console.error(err.stack)
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

run()
