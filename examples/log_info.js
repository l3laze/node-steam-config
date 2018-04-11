'use strict'

const path = require('path')
const cli = require('cli')
const steam = require('../src/index.js')

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  steam: ['s', 'Path to Steam installation', 'path', undefined],
  user: ['u', 'User to log info for', 'string', undefined]
})

async function run () {
  try {
    if (!options.steam) {
      console.info('Trying to find default path to Steam...')

      await steam.detectRoot(true)
    } else {
      options.steam = path.join(options.steam.replace(/(\.\/)/, `${__dirname}/`))

      await steam.setRoot(options.steam)
    }

    if (!options.user) {
      await steam.detectUser(true)
    } else {
      await steam.setUser(options.user)
    }

    options.user = steam.paths.id64

    await steam.load(steam.paths.all)
    await steam.load(steam.paths.steamapps())
    await steam.load(steam.paths.steamapps(path.join(__dirname, 'Dummy', 'External Steam Library Folder')))

    steam.appendToApps = true

    console.info('User:', steam.loginusers.users[ steam.paths.id64 ].PersonaName)
    console.info('appinfo:', steam.appinfo.length)
    console.info('config:', steam.config ? 'exists' : 'nope')
    console.info('libraryfolders:', Object.keys(steam.libraryfolders).length)
    console.info('registry:', steam.registry ? 'exists' : 'nope')
    console.info('skins:', steam.skins.length)
    console.info('steamapps:', steam.apps.length)
    console.info('loginusers:', Object.keys(steam.loginusers.users).length)
    console.info('currentUser - localconfig:', steam.loginusers.users[ steam.paths.id64 ].localconfig ? 'exists' : 'nope')
    console.info('currentUser - sharedconfig:', steam.loginusers.users[ steam.paths.id64 ].sharedconfig ? 'exists' : 'nope')
    console.info('currentUser - shortcuts:', steam.loginusers.users[ steam.paths.id64 ].shortcuts ? 'exists' : 'nope')
  } catch (err) {
    throw err
  }
}

(async () => {
  try {
    await run()
  } catch (err) {
    console.error(err)
  }
})()
