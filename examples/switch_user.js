'use strict'

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
  user: ['u', 'User to switch to by account name or display name.', 'string', null]
})

let steam = new SteamConfig()

async function run () {
  if (options.path === null) {
    console.info('Trying to find default path to Steam...')
    steam.detectRoot(true)
  } else {
    steam.setRoot(options.path)
  }

  await steam.load([steam.paths.registry, steam.paths.loginusers])

  let userKeys = Object.keys(steam.loginusers.users)

  if (options.user === null && userKeys.length > 2) {
    console.error(`There are ${userKeys.length} users associated with this Steam installation; cannott auto-switch between more than 2.`)
    process.exit(1)
  }

  for (let i = 0; i < userKeys.length; i++) {
    if (options.user !== null) {
      if (steam.loginusers.users[userKeys[ i ]].AccountName === options.user || steam.loginusers.users[userKeys[ i ]].PersonaName === options.user) {
        steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser = steam.loginusers.users[userKeys[ i ]].AccountName
        await steam.save(steam.paths.registry)
        console.info(`Switched to ${steam.loginusers.users[userKeys[ i ]].PersonaName}.`)
        process.exit(0)
      }
    } else if (steam.loginusers.users[userKeys[ i ]].AccountName !== steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) {
      steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser = steam.loginusers.users[userKeys[ i ]].AccountName
      await steam.save(steam.paths.registry)
      console.info(`Switched to ${steam.loginusers.users[userKeys[ i ]].PersonaName}.`)
      process.exit(0)
    }
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
