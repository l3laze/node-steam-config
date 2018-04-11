/**
 * @module SteamPaths
 *
 * @property {Path} root - The root of the Steam installation.
 * @property {Number} id64 - The current user's Steam ID64.
 * @property {Number} accountId - The current user's Steam3::account ID
 * @property {Array} all - All of the configuration file paths except steamapps skins.
 * @property {Object} appinfo - Path to the file appinfo.vdf.
 * @property {Object} config - Path to the file config.vdf.
 * @property {Object} libraryfolders - Path to the file libraryfolders.vdf.
 * @property {Object} localconfig - Path to the user-specific file localconfig.vdf.
 * @property {Object} loginusers - Path to the file loginusers.vdf.
 * @property {Object} registry - Path to the file registry.vdf (or it's equivalent from the Registry on Windows).
 * @property {Object} sharedconfig - Path to the user-specific file sharedconfig.vdf (or  Registry on Windows).
 * @property {Object} shortcuts - Path to the user-specific file shortcuts.vdf.
 * @property {Object} skins - Path to the skins folder.
 */
'use strict'

const path = require('path')
const platform = require('os').platform()

function SteamPaths () {
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
    set skins (to) {}
  }

  /**
   * @description Get the path to a Steam app.
   * @module SteamPaths
   * @method app
   * @param {string} id - The Steam appid of the app to load.
   * @param {Path} library - The path to the Steam Library Folder to load the app from.  If undefined it will use the default folder.
   * @return {Path} - The path to the app
   */
  obj.app = function getApp (id, library = undefined) {
    if (typeof library === 'undefined') {
      if (platform !== 'linux') {
        library = path.join(rootPath, 'steamapps')
      } else {
        library = path.join(rootPath, 'steam', 'steamapps')
      }
    }

    return path.join(library, `appmanifest_${id}.acf`)
  }

  /**
  * @description Get the paths to all of the Steam apps in a Steam Library Folder.
  * @module SteamPaths
  * @method steamapps
  * @param {Path} library - The path to the Steam Library Folder to load. If undefined it will use the default folder.
  * @return {Path} - The path to the apps that the Steam Library Folder contains.
  */
  obj.steamapps = function getSteamApps (library = undefined) {
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

  return obj
}

module.exports = new SteamPaths()
