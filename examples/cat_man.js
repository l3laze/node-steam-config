'use strict'

const fs = require('fs')
const path = require('path')
const cli = require('cli')
const dp = require('dot-property')
const steam = require('../src/index.js')
const afs = require('../src/asyncLib.js')

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  steam: ['s', 'Path to Steam installation.', 'path', undefined],
  user: ['u', 'User to auto-categorize games for.', 'string', undefined],
  backup: ['b', 'Backup categories', 'boolean', false],
  restore: ['r', 'Restore categories', 'boolean', false],
  overwrite: ['o', 'Destroy existing categories (only while restoring)', 'boolean', false]
})

async function backupCats (apps, options) {
  let backup = path.join(__dirname, 'data', `cats-${options.id64}.json`)

  try {
    await afs.writeFileAsync(backup, JSON.stringify(apps, null, '\t'))
  } catch (err) {
    throw err
  }

  return backup
}

async function restoreCats (apps, options) {
  let backup

  try {
    apps = steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps

    backup = path.join(__dirname, 'data', `cats-${options.id64}.json`)

    if (!fs.existsSync(backup)) {
      throw new Error(`There is no backup file @ ${backup} to restore from for ${options.user || steam.loginusers.users[ options.id64 ].PersonaName} (id64: ${options.id64})`)
    }

    backup = JSON.parse('' + await afs.readFileAsync(backup))

    if (options.overwrite) {
      Object.keys(apps).forEach((app) => {
        if (dp.has(apps[ app ], 'tags')) {
          delete apps[ app ].tags
        }

        if (!dp.has(apps[ app ], 'Hidden') && !dp.has(apps[ app ], 'cloudenabled')) {
          delete apps[ app ]
        }
      })
    }

    Object.keys(backup).forEach((k) => {
      if (!dp.has(apps, k)) {
        apps[ k ] = Object.assign({}, backup[ k ])
      } else {
        apps[ k ] = Object.assign({}, backup[ k ], apps[ k ])
      }
    })
  } catch (err) {
    throw err
  }

  return apps
}

async function handleAction (apps, options) {
  const action = options.backup ? 'Backing up' : (options.overwrite ? 'Restoring (overwrite mode)' : 'Restoring (append mode)')

  console.info(`${action}...`)

  try {
    if (options.backup) {
      await backupCats(apps, options)
    } else {
      apps = await restoreCats(apps, options)

      await steam.save(steam.paths.sharedconfig)
    }
  } catch (err) {
    throw err
  }

  console.info(Object.keys(apps).length, 'items categorized')
}

async function run () {
  try {
    if (!options.backup && !options.restore) {
      return console.info(`No mode set. Nothing to do!`)
    }

    if (!options.steam) {
      await steam.detectRoot(true)
      options.steam = steam.paths.rootPath
    } else {
      options.steam = path.join(options.steam.replace(/(\.\/)/, `${__dirname}/`))

      await steam.setRoot(path.join(options.steam))
    }

    await steam.load(steam.paths.registry, steam.paths.loginusers)

    if (!options.user) {
      await steam.detectUser(true)
    } else {
      await steam.setUser(options.user)
    }

    options.id64 = '' + steam.paths.id64

    await steam.load(steam.paths.sharedconfig)

    let sc = Object.assign({}, steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)

    await handleAction(sc, options)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
