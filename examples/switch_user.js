'use strict'

const steam = require('../src/index.js')
const cli = require('cli')
const path = require('path')

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  steam: ['s', 'Path to Steam installation.', 'path'],
  user: ['u', 'User to switch to by account name or display name.', 'string']
})

async function run () {
  if (options.steam === null) {
    console.info('Trying to find default path to Steam...')
    await steam.detectRoot(true)
  } else {
    options.steam = path.join(options.steam.replace(/(\.\/)/, `${__dirname}/`))

    await steam.setRoot(options.steam)
  }

  await steam.load(steam.paths.registry, steam.paths.loginusers)

  let userKeys = Object.keys(steam.loginusers.users)

  if (options.user === null && userKeys.length > 2) {
    throw new Error(`There are ${userKeys.length} users associated with the Steam installation at ${steam.paths.root}. Cannot auto-switch between more than 2.`)
  }

  let found

  for (let i = 0; i < userKeys.length; i++) {
    if (options.user !== null) {
      found = await steam.findUser(options.user)

      if (typeof found.id64 !== 'undefined') {
        steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser = steam.loginusers.users[ found.id64 ].AccountName
        await steam.save(steam.paths.registry)
        console.info(`Switched to ${steam.loginusers.users[ found.id64 ].PersonaName}.`)
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

(async () => {
  try {
    await run()
  } catch (err) {
    throw err
  }
})()
