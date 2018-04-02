'use strict'

const path = require('path')
const platform = require('os').platform()

function steamPaths () {
  let rootPath
  let id64
  let accountId

  let obj = {
    get root () {
      return rootPath
    },
    set root (to) {
      rootPath = to
    },

    get id64 () {
      return id64
    },
    set id64 (to) {
      id64 = to
    },

    get accountId () {
      return accountId
    },
    set accountId (to) {
      accountId = to
    },

    get all () {
      return Object.keys(this).filter(function filterAll (k) {
        return k !== 'root' &&
          k !== 'id64' &&
          k !== 'accountId' &&
          k !== 'all' &&
          k !== 'steamapps' &&
          k !== 'app' &&
          k !== 'skins'
      }).map((k) => this[ k ])
    },
    set all (to) {},

    get appinfo () {
      if (platform !== 'linux') {
        return path.join(rootPath, 'appcache', 'appinfo.vdf')
      } else {
        return path.join(rootPath, 'steam', 'appcache', 'appinfo.vdf')
      }
    },
    set appinfo (to) {},

    get config () {
      if (platform !== 'linux') {
        return path.join(rootPath, 'config', 'config.vdf')
      } else {
        return path.join(rootPath, 'steam', 'config', 'config.vdf')
      }
    },
    set config (to) {},

    get libraryfolders () {
      if (platform !== 'linux') {
        return path.join(rootPath, 'steamapps', 'libraryfolders.vdf')
      } else {
        return path.join(rootPath, 'steam', 'steamapps', 'libraryfolders.vdf')
      }
    },
    set libraryfolders (to) {},

    get localconfig () {
      if (platform !== 'linux') {
        return path.join(rootPath, 'userdata', accountId, 'config', 'localconfig.vdf')
      } else {
        return path.join(rootPath, 'steam', 'userdata', accountId, 'config', 'localconfig.vdf')
      }
    },
    set localconfig (to) {},

    get loginusers () {
      if (platform !== 'linux') {
        return path.join(rootPath, 'config', 'loginusers.vdf')
      } else {
        return path.join(rootPath, 'steam', 'config', 'loginusers.vdf')
      }
    },
    set loginusers (to) {},

    get registry () {
      if (platform !== 'win32') {
        return path.join(rootPath, 'registry.vdf')
      } else {
        return path.join('registry.winreg')
      }
    },
    set registry (to) {},

    get sharedconfig () {
      if (platform !== 'linux') {
        return path.join(rootPath, 'userdata', accountId, '7', 'remote', 'sharedconfig.vdf')
      } else {
        return path.join(rootPath, 'steam', 'userdata', accountId, '7', 'remote', 'sharedconfig.vdf')
      }
    },
    set sharedconfig (to) {},

    get shortcuts () {
      if (platform !== 'linux') {
        return path.join(rootPath, 'userdata', accountId, 'config', 'shortcuts.vdf')
      } else {
        return path.join(rootPath, 'steam', 'userdata', accountId, 'config', 'shortcuts.vdf')
      }
    },
    set shortcuts (to) {},

    get skins () {
      if (platform !== 'darwin') {
        return path.join(rootPath, 'skins')
      } else {
        return path.join(rootPath, 'Steam.AppBundle', 'Steam', 'Contents', 'MacOS', 'skins')
      }
    },
    set skins (to) {},

    app (id, library = undefined) {
      if (typeof library === 'undefined') {
        if (platform !== 'linux') {
          library = path.join(rootPath, 'steamapps')
        } else {
          library = path.join(rootPath, 'steam', 'steamapps')
        }
      }

      return path.join(library, `appmanifest_${id}.acf`)
    },

    steamapps (library = undefined) {
      if (typeof library === 'undefined') {
        if (platform !== 'linux') {
          library = rootPath
        } else {
          library = path.join(rootPath, 'steam')
        }
      }

      return {
        apps: Array.from(require('fs').readdirSync(path.join(library, 'steamapps')))
          .filter((i) => i.indexOf('.acf') !== -1)
          .map((i) => path.join(library, 'steamapps', i))
      }
    }
  }

  return obj
}

module.exports = steamPaths()
