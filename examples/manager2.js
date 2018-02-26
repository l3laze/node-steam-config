'use strict'

const path = require('path')
const fs = require('fs')
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
  user: ['u', 'User to switch to by account name or display name.', 'string', null],
  backup: ['b', 'Backup mode', 'boolean', false],
  restore: ['r', 'Restore mode', 'boolean', false]
})

let steam = new SteamConfig()

async function run () {
  await init()
}

async function init () {
  if (!options.backup && !options.restore) {
    console.error('No mode set; nothing to do.')
    process.exit(0)
  }

  if (options.path) {
    await steam.setRoot(options.path)
  } else {
    await steam.detectRoot(true)
  }

  await steam.load([steam.paths.loginusers, steam.paths.registry])

  if (options.user) {
    await steam.setUser(options.user)
  } else {
    await steam.detectUser(true)
  }

  let paths = steam.paths.all.filter(p => p.indexOf('appinfo') === -1 && p.indexOf('skins') === -1 && p.indexOf('libraryfolders') === -1)
  console.info(paths)

  await steam.load(paths)

  console.info('User:', steam.currentUser.id64)
}

try {
  run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
