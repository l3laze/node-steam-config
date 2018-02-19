const SteamConfig = require('../index.js')

let steam = new SteamConfig();

(async function run () {
  steam.detectRoot(true)
  steam.currentUser = {
    accountId: '107311984',
    id64: '76561198067577712'
  }
  await steam.load(steam.getPath('all', steam.currentUser.id64, steam.currentUser.accountId))

  console.info('appinfo', typeof steam.appinfo)
  console.info('config:', typeof steam.config)
  console.info('libraryfolders', typeof steam.libraryfolders)
  console.info('registry:', typeof steam.registry)
  console.info('skins:', typeof steam.skins)
  console.info('steamapps:', typeof steam.steamapps)
  console.info('loginusers:', typeof steam.loginusers)
  console.info('currentUser - localconfig:', typeof steam.loginusers.users[ steam.currentUser.id64 ].localconfig)
  console.info('currentUser - sharedconfig:', typeof steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig)
  console.info('currentUser - shortcuts:', typeof steam.loginusers.users[ steam.currentUser.id64 ].shortcuts)
})()
