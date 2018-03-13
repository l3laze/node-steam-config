const SteamConfig = require('../lib/index.js')

let steam = new SteamConfig();

(async function run () {
  try {
    steam.detectRoot(true)
    await steam.load(steam.paths.loginusers)
    steam.detectUser(true)
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
    console.error(err)
    process.exit(1)
  }
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
