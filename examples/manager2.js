'use strict'

const path = require('path')
const fs = require('fs')
const SteamConfig = require('../index.js')
const cli = require('cli')
const os = require('os')
const mkdirp = require('mkdirp')

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
  restore: ['r', 'Restore mode', 'boolean', false],
  destination: ['d', 'Data folder for backups', 'path', null]
})

let steam = new SteamConfig()

async function run () {
  await init()

  console.info('User:', steam.currentUser.id64)

  if (options.backup) {
    await backup()
  }

  if (options.restore) {
    await restore()
  }
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
  await steam.load(paths)

  if (!options.destination) {
    options.destination = path.join(__dirname, 'data')
  }

  if (!fs.existsSync(options.destination)) {
    mkdirp(options.destination)
  }
}

async function backup () {
  let data = {
    arch: os.arch(),
    platform: os.platform(),

    config: Object.assign({}, steam.config),
    localconfig: Object.assign({}, steam. loginusers.users[ steam.currentUser.id64 ].localconfig),
    loginusers: Object.assign({}, steam.config),
    registry: Object.assign({}, steam.config),
    sharedconfig: Object.assign({}, steam. loginusers.users[ steam.currentUser.id64 ]. sharedconfig),
    shortcuts: Object.assign({}, steam. loginusers.users[ steam.currentUser.id64 ]. shortcuts)
  }

  let tmp = steam.loginusers.users[ steam.currentUser.id64 ]

  data.user = {
    AccountName: tmp.AccountName,
    PersonaName: tmp.PersonaName,
    accountId: tmp.accountId,
    id64: tmp.id64
  }

  await fs.writeFile(path.join(options.destination, `backup-${steam.currentUser.id64}.json`))
}

async function restore () {
  let file = path.join(options.destination, `backup-${steam.currentUser.id64}.json`)
  let data = await fs.writeFile(file, JSON.stringify)

    steam.config = Object.assign(steam.config, data.config)
    steam.loginusers = Object.assign(steam.loginusers, data.loginusers),
    steam.registry = Object.assign(steam.registry, data.registry),
    steam.loginusers.users[ data.user.id64 ].sharedconfig = Object.assign(steam.loginusers.users[ data.user.id64 ].sharedconfig, data.sharedconfig),
    steam.loginusers.users[ data.user.id64 ]. localconfig = Object.assign(steam.loginusers.users[ data.user.id64 ].localconfig, data. localconfig),
    steam.loginusers.users[ data.user.id64 ]. shortcuts = Object.assign(steam.loginusers.users[ data.user.id64 ].shortcuts, data.shortcuts)
  }
}

try {
  run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
