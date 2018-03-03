/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 */

'use strict'

const fs = require('fs')
const path = require('path')
const platform = require('os').platform()

/**
 * A set of values & two helper functions representing the Steam configuration files SteamConfig can handle.
 * @class
 * @property {String} id64 - Used to find a user in the loginusers data.
 * @property {String} accountId - A user Steam3:accountId to use for paths in the userdata folder, etc.
 * @property {Path} rootPathOf - The root of the Steam installation for this instance.
 *
 * @property {Array} all - Everything except the non-default Steam Library Folders.
 * @property {String} appinfo - appinfo => /appcache/appinfo.vdf.
 * @property {String} config - config => /config/config.vdf.
 * @property {String} libraryfolders - libraryfolders => /steamapps/libraryfolders.vdf.
 * @property {String} localconfig - localconfig => /userdata/{accountId}/config/localconfig.vdf.
 * @property {String} loginusers - loginusers => /config/loginusers.vdf.
 * @property {String} packageinfo - packageinfo => /appcache/packageinfo.vdf.
 * @property {String} registry - registry => ../registry.vdf on Linux, /registry.vdf on Mac or winreg on Windows.
 * @property {String} shortcuts - shortcuts => /userdata/{accountId}/config/shortcuts.vdf.
 * @property {String} sharedconfig - sharedconfig => userdata/{accountId}/7/remote/sharedconfig.vdf.
 * @property {Array} skins - skins => skins/ on Linux or Winows, /Steam.AppBundle/Steam/Contents/MacOS/skins on Mac.
 */
function SteamPaths () {
  let id64 = 0
  let accountId = 0
  var rootPathOf = ''

  let obj = {
    get rootPath () {
      return rootPathOf
    },
    set rootPath (to) {
      if (!to || to === '') {
        throw new Error(`${to} is an invalid root path.`)
      } else if (!fs.existsSync(to)) {
        throw new Error(`${to} is an invalid root path because it does not exist.`)
      }

      rootPathOf = to
    },
    get id64 () {
      return id64
    },
    set id64 (to) {
      if (typeof to !== 'string') {
        throw new Error(`${to} with type ${typeof to} is an invalid id64.`)
      }

      id64 = to
    },
    get accountId () {
      return accountId
    },
    set accountId (to) {
      if (typeof to !== 'string') {
        throw new Error(`${to} with type ${typeof to} is an invalid accountId.`)
      }

      accountId = to
    },

    get all () {
      return Object.keys(this)
        .filter((k) => k !== 'rootPath' && k !== 'id64' && k !== 'accountId' && k !== 'all' && k !== 'app' && k !== 'steamapps')
        .map((k) => this[ k ])
    },
    set all (to) {
    },
    /**
     * @method
     * @name SteamPaths#app
     * @param {String} appid - The appid of the appmanifest_{appid}.acf file to load.
     * @param {Path} library - The library to load the appmanifest file from, or undefined to load from the default steamapps folder.
     * @throws {Error} - If appid is undefined, or library path does not exist, or the appmanifest_{appid}.acf file does not exist.
     * @returns {Path} - The path to {library}/steamapps/appmanifest_{appid}.acf file.
     */
    app (appid, library) {
      let appPath

      if (!appid) {
        throw new Error('Need an appid to get the path to an app')
      } else if (!library) {
        library = path.join(rootPathOf, 'steamapps')
      }

      if (!fs.existsSync(library)) {
        throw new Error(`Library path ${library} does not exist. If it is on an external drive make sure it is properly plugged in and mounted and try again.`)
      }

      appPath = path.join(library, `appmanifest_${appid}.acf`)

      if (!fs.existsSync(appPath)) {
        throw new Error(`App file ${appPath} does not exist.`)
      }

      return appPath
    },
    get appinfo () {
      let tmp = path.join(rootPathOf, 'appcache', 'appinfo.vdf')
      if (!fs.existsSync(tmp)) {
        throw new Error(`File ${tmp} does not exist.`)
      }

      return tmp
    },
    set appinfo (to) {
    },
    get config () {
      let tmp = path.join(rootPathOf, 'config', 'config.vdf')
      if (!fs.existsSync(tmp)) {
        throw new Error(`File ${tmp} does not exist.`)
      }

      return tmp
    },
    set config (to) {
    },
    get libraryfolders () {
      let tmp = path.join(rootPathOf, 'steamapps', 'libraryfolders.vdf')
      if (!fs.existsSync(tmp)) {
        throw new Error(`File ${tmp} does not exist.`)
      }

      return tmp
    },
    set libraryfolders (to) {
    },
    get localconfig () {
      let tmp = path.join(rootPathOf, 'userdata', accountId, 'config', 'localconfig.vdf')
      if (!fs.existsSync(tmp)) {
        throw new Error(`File ${tmp} does not exist.`)
      }

      return tmp
    },
    set localconfig (to) {
    },
    get loginusers () {
      let tmp = path.join(rootPathOf, 'config', 'loginusers.vdf')
      if (!fs.existsSync(tmp)) {
        throw new Error(`File ${tmp} does not exist.`)
      }

      return tmp
    },
    set loginusers (to) {
    },
    get registry () {
      let tmp
      switch (platform) {
        case 'win32':
          tmp = 'winreg'
          break

        case 'darwin':
          tmp = path.join(rootPathOf, 'registry.vdf')
          if (!fs.existsSync(tmp)) {
            throw new Error(`File ${tmp} does not exist.`)
          }
          break

        case 'linux':
          tmp = path.join(rootPathOf, '..', 'registry.vdf')
          if (!fs.existsSync(tmp)) {
            throw new Error(`File ${tmp} does not exist.`)
          }
      }

      return tmp
    },
    set registry (to) {
    },
    get sharedconfig () {
      let tmp = path.join(rootPathOf, 'userdata', accountId, '7', 'remote', 'sharedconfig.vdf')
      if (!fs.existsSync(tmp)) {
        throw new Error(`File ${tmp} does not exist.`)
      }

      return tmp
    },
    set sharedconfig (to) {
    },
    get shortcuts () {
      let tmp = path.join(rootPathOf, 'userdata', accountId, 'config', 'shortcuts.vdf')
      if (!fs.existsSync(tmp)) {
        throw new Error(`File ${tmp} does not exist.`)
      }

      return tmp
    },
    set shortcuts (to) {
    },
    get skins () {
      let tmp

      switch (platform) {
        case 'win32':
        case 'linux':
          tmp = path.join(rootPathOf, 'skins')
          break

        case 'darwin':
          tmp = path.join(rootPathOf, 'Steam.AppBundle', 'Steam', 'Contents', 'MacOS', 'skins')
          break
      }

      if (!fs.existsSync(tmp)) {
        throw new Error(`File ${tmp} does not exist.`)
      }

      return tmp
    },
    set skins (to) {
    },
    /**
     * @method
     * @name SteamPaths#steamapps
     * @param {Path} library - The library to load the steamapps folder from, or undefined to load the default steamapps folder.
     * @throws {Error} - If the library path given does not contain a steamapps folder.
     * @returns {Path} - The path to the library folder's steamapps folder.
     */
    steamapps (library) {
      if (!library) {
        library = rootPathOf
      }

      library = path.join(library, 'steamapps')

      if (!fs.existsSync(library)) {
        throw new Error(`'${library}/steamapps' folder does not exist.`)
      }

      return library
    }
  }

  return obj
}

module.exports = SteamPaths
