'use strict'

const path = require('path')
const cli = require('cli')
const SteamConfig = require('../lib/index.js')

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  steam: ['s', 'Path to Steam installation.', 'path', undefined],
  user: ['u', 'User to switch to by account name or display name.', 'string', undefined]
})

let steam = new SteamConfig()

async function run () {
  try {
    if (!options.steam) {
      console.info('Trying to find default path to Steam...')
      steam.detectRoot(true)
    } else {
      steam.setRoot(path.join(options.steam))
    }

    await steam.load([steam.paths.registry, steam.paths.loginusers])
    if (!options.user) {
      steam.detectUser(true)
    } else {
      steam.setUser(options.user)
    }

    options.user = steam.currentUser.id64

    await steam.load(steam.paths.all.concat([ steam.paths.steamapps() ]))

    steam.appendToApps = true
    let tmp = Object.values(steam.libraryfolders.LibraryFolders)

    for (let f of tmp) {
      await steam.load(steam.paths.steamapps(f))
    }

    console.info('User:', steam.currentUser.PersonaName)
    console.info('appinfo:', steam.appinfo.length)
    console.info('config:', steam.config ? 'exists' : 'nope')
    console.info('libraryfolders:', Object.keys(steam.libraryfolders).length)
    console.info('registry:', steam.registry ? 'exists' : 'nope')
    console.info('skins:', steam.skins.length)
    console.info('steamapps:', steam.steamapps.length)
    console.info('loginusers:', Object.keys(steam.loginusers.users).length)
    console.info('currentUser - localconfig:', steam.loginusers.users[ steam.currentUser.id64 ].localconfig ? 'exists' : 'nope')
    console.info('currentUser - sharedconfig:', steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig ? 'exists' : 'nope')
    console.info('currentUser - shortcuts:', steam.loginusers.users[ steam.currentUser.id64 ].shortcuts ? 'exists' : 'nope')
  } catch (err) {
    throw err
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
