'use strict'

const path = require('path')
const steam = require('../src/index.js')
const cli = require('cli')
const os = require('os')
const fs = require('fs')
const dp = require('dot-property')
const afs = require('../src/asyncLib.js')

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  steam: ['s', 'Path to Steam installation.', 'path', null],
  user: ['u', 'User to switch to by account name or display name.', 'string', null],
  backup: ['b', 'Backup mode', 'boolean', false],
  restore: ['r', 'Restore mode', 'boolean', false]
})

function removeKeys (obj, keys) {
  keys.forEach((k) => {
    obj = dp.remove(obj, k)
  })
  return obj
}

function cleanObject (obj, clean) {
  let listKeys = Object.keys(clean)

  obj = Object.assign({}, obj)
  obj = removeKeys(obj, Object.keys(obj).filter((k) => listKeys.includes(k) === false))

  listKeys.forEach((k) => {
    let val = dp.get(clean, k)

    if (typeof val === 'object') {
      obj = dp.set(obj, k, cleanObject(dp.get(obj, k), val))
    }
  })

  return obj
}

async function init () {
  try {
    if (!options.backup && !options.restore) {
      console.error('No mode set; nothing to do.')
      process.exit(0)
    }

    if (options.steam) {
      options.steam = path.join(options.steam.replace(/(\.\/)/, `${__dirname}/`))

      await steam.setRoot(path.join(options.steam))
    } else {
      await steam.detectRoot(true)
    }

    await steam.load(steam.paths.loginusers, steam.paths.registry)

    if (options.user) {
      await steam.setUser(options.user)
    } else {
      await steam.detectUser(true)
    }

    let paths = steam.paths.all.filter(p => p.indexOf('appinfo') === -1 && p.indexOf('skins') === -1 && p.indexOf('libraryfolders') === -1)
    await steam.load(paths)

    if (!options.destination) {
      options.destination = path.join(__dirname, 'data')
    }

    if (!fs.existsSync(options.destination)) {
      await afs.mkdirpAsync(options.destination)
    }
  } catch (err) {
    throw err
  }
}

function stripLoginUsers (lu) {
  Object.keys(lu).forEach((u) => {
    delete lu[ u ].sharedconfig
    delete lu[ u ].localconfig
    delete lu[ u ].id64
    delete lu[ u ].accountId
  })
}

async function backup () {
  const cleaned = require('../src/cleanSteam.js')

  console.info('Backing up...')

  try {
    let data = {
      arch: os.arch(),
      platform: os.platform(),

      config: cleanObject(steam.config, cleaned.config),
      localconfig: cleanObject(steam.localconfig, cleaned.localconfig),
      registry: cleanObject(steam.registry, cleaned.registry),
      sharedconfig: cleanObject(steam.sharedconfig, cleaned.sharedconfig),
      loginusers: Object.assign({}, stripLoginUsers(steam.loginusers.users)),
      user: Object.assign({}, {
        AccountName: steam.loginusers.users[ steam.paths.id64 ].AccountName,
        PersonaName: steam.loginusers.users[ steam.paths.id64 ].PersonaName,
        accountId: steam.paths.accountId,
        id64: steam.paths.id64
      })
    }

    await afs.writeFileAsync(path.join(options.destination, `backup-${steam.paths.id64}.json`), JSON.stringify(data, null, 2))
  } catch (err) {
    throw err
  }
}

async function restore () {
  let file = path.join(options.destination, `backup-${steam.paths.id64}.json`)
  let data

  console.info('Restoring...')

  try {
    data = JSON.parse(await afs.readFileAsync(file))

    steam.config = Object.assign({}, data.config, steam.config)
    steam.loginusers = Object.assign({}, data.loginusers, steam.loginusers)
    steam.registry = Object.assign({}, data.registry, steam.registry)
    steam.sharedconfig = Object.assign({}, steam.sharedconfig, data.sharedconfig)
    steam.localconfig = Object.assign({}, steam.localconfig, data.localconfig)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('No backup to restore from.')
    } else {
      throw err
    }
  }

  await steam.save(steam.paths.config, steam.paths.loginusers, steam.paths.registry, steam.paths.sharedconfig, steam.paths.localconfig)
}

async function run () {
  try {
    await init()

    console.info('User:', steam.paths.id64)

    if (options.backup) {
      await backup()
    }

    if (options.restore) {
      await restore()
    }
  } catch (err) {
    throw err
  }

  console.info('Finished')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
