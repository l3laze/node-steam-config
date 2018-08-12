'use strict'

const arch = /64/.test(process.env.PROCESSOR_ARCHITECTURE) ? '64' : '86'

const platformPaths = {
  darwin: {
    root: '~/Library/Application Support/Steam',
    appinfo: '/appcache/appinfo.vdf',
    config: '/config/config.vdf',
    libraryfolders: '/steamapps/libraryfolders.vdf',
    localconfig: '/userdata/accountID/config/localconfig.vdf',
    loginusers: '/config/loginusers.vdf',
    registry: '/registry.vdf',
    sharedconfig: '/userdata/accountID/7/remote/sharedconfig.vdf',
    shortcuts: '/userdata/accountID/config/shortcuts.vdf',
    steamapps: '/steamapps',
    skins: '/Steam.AppBundle/Steam/Contents/MacOS/skins'
  },
  linux: {
    root: '~/.steam',
    appinfo: '/steam/appcache/appinfo.vdf',
    config: '/steam/config/config.vdf',
    libraryfolders: '/steam/steamapps/libraryfolders.vdf',
    localconfig: '/steam/userdata/accountID/config/localconfig.vdf',
    loginusers: '/steam/config/loginusers.vdf',
    registry: '/registry.vdf',
    sharedconfig: '/steam/userdata/accountID/7/remote/sharedconfig.vdf',
    shortcuts: '/steam/userdata/accountID/config/shortcuts.vdf',
    steamapps: '/steam/steamapps',
    skins: '/skins'
  },
  win32: {
    root: (arch === '64' ? 'C:\\Program Files (x86)\\Steam' : 'C:\\Program Files\\Steam'),
    appinfo: '/appcache/appinfo.vdf',
    config: '/config/config.vdf',
    libraryfolders: '/steamapps/libraryfolders.vdf',
    localconfig: '/userdata/accountID/config/localconfig.vdf',
    loginusers: '/config/loginusers.vdf',
    registry: 'winreg',
    sharedconfig: '/userdata/accountID/7/remote/sharedconfig.vdf',
    shortcuts: '/userdata/accountID/config/shortcuts.vdf',
    steamapps: '/steamapps',
    skins: '/skins'
  }
}

module.exports = platformPaths
