/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 */

'use strict'

const fs = require('fs')
const path = require('path')
const {Registry} = require('rage-edit')
const dp = require('dot-property')
const TVDF = require('simple-vdf2')
const BVDF = require('./bvdf.js')
const SteamPaths = require('./steam-paths.js')
const afs = require('./async-fs.js')

const home = require('os').homedir()
const arch = require('os').arch()
const platform = require('os').platform()

const getAccountId = require('./steamdata-utils.js').getAccountIdFromId64

async function asyncMap (array, callback) {
  try {
    for (let index = 0; index < array.length; index += 1) {
      array[ index ] = await callback(array[ index ], index, array)
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }

  return array
}

/*
  async function asyncForEach (array, callback) {
  try {
    for (let index = 0; index < array.length; index += 1) {
      await callback(array[index], index, array)
    }
  } catch (err) {
    throw err
  }
}
*/

function prepareFilenames (entries) {
  let important = []
  let first = []
  let last = []

  for (let entry of entries) {
    if (/sharedconfig|localconfig|shortcuts/.test(entry)) {
      last.push(entry)
    } else if (/loginusers|registry/.test(entry)) {
      important.push(entry)
    } else {
      first.push(entry)
    }
  }

  return important.concat(first.concat(last))
}

function afterLoad (name, data) {
  switch (name) {
    case 'libraryfolders':
      let keys = Object.keys(data.LibraryFolders)
      for (let keyName of keys) {
        if (keyName === 'TimeNextStatsReport' || keyName === 'ContentStatsID') {
          delete data.LibraryFolders[ keyName ]
        }
      }
      break

    case 'loginusers':
      Object.keys(data.users).forEach((k) => {
        data.users[ k ].id64 = k
        data.users[ k ].accountId = getAccountId(k)
      })
      break

    default:
      break
  }
  return data
}

function loadSkins (skins) {
  return skins.filter((f) => f.indexOf('.txt') === -1 && f.charAt(0) !== '.')
}

function getAppForSave (apps, app) {
  return apps.filter((a) => a.AppState.appid === app)[ 0 ]
}

/**
 * SteamConfig constructor.
 * @constructor
 * @property {string} rootPath        - The install location of the Steam client.
 * @property {string} currentUser     - The user SteamConfig will load/save Steam configuration data for.
 * @property {Object} winreg          - An instance of rage-edit's Registry class.
 * @property {Object} paths           - An instance of the SteamPaths class.
 * @property {boolean} appendToApps   - Append loaded apps to this.steamapps, or overwrite it.
 *
 * @property {string} registry        - Windows Registry, or Text VDF file Steam/registry.vdf on Linux/Mac.
 * @property {string} config          - Value of Text VDF file Steam/config/config.vdf.
 * @property {string} loginusers      - Value of Text VDF file Steam/config/loginusers.vdf.
 * @property {string} libraryfolders  - Value of Text VDF file Steam/steamapps/libraryfolders.vdf.
 * @property {string} appinfo         - Value of Binary VDF file Steam/appcache/appinfo.vdf.
 * @property {Array} skins            - Array of names of skin folders as strings.
 * @property {Array} steamapps        - Array of appmanifest_#.acf Text VDF file(s) loaded from Steam Library Folder(s).
 */
function SteamConfig () {
  this.rootPath = null
  this.currentUser = null
  this.winreg = null
  this.paths = new SteamPaths()

  this.appendToApps = false
  this.tags = null

  this.appinfo = null
  this.config = null
  this.libraryfolders = null
  this.loginusers = null
  this.registry = null
  this.skins = null
  this.steamapps = null
}

/**
 * Attempt to detect the root installation path based on platform-specific default installation locations. Will also set the path if autoSet is true.
 * @method
 * @param {boolean} autoSet=false - Whether to set the root path; if undefined or false detected path will be returned.
 * @throws {Error} - If the current OS is not supported.
 * @returns {Path} - If autoSet is false: if a path is detected it is returned, otherwise returns null if the default path is not found or does not exist.
 */
SteamConfig.prototype.detectRoot = async function detectRoot (autoSet = false) {
  let detected
  try {
    switch (platform) {
      case 'darwin':
        detected = path.join(home, 'Library', 'Application Support', 'Steam')
        break

      case 'linux':
        detected = path.join(home, '.steam')
        break

      case 'win32':
        if (arch === 'ia32') {
          detected = path.join('C:\\', 'Program Files (x86)', 'Steam')
        } else {
          detected = path.join('C:\\', 'Program Files', 'Steam')
        }

        if (!fs.existsSync(detected)) {
          detected = await (new Registry('HKLM\\Software\\Valve\\Steam')).get('InstallPath') || null
        }
        break
    }

    /* istanbul ignore next */
    if (!fs.existsSync(detected)) {
      detected = null
    }

    if (autoSet && detected) {
      this.setRoot(detected)
    } else {
      return detected
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }
}

/**
 * Attempt to set the root path of the Steam installation.
 * @method
 * @param {Path} toPath - The path to set as the root.
 * @throws {Error} - If toPath is an invalid path, does not exist, or if the path is not a valid Steam installation.
 */
SteamConfig.prototype.setRoot = function setRoot (toPath) {
  if (!toPath || typeof toPath !== 'string' || toPath === '') {
    throw new Error(`${toPath} is an invalid path argument.`)
  } else if (!fs.existsSync(toPath)) {
    throw new Error(`${toPath} does not exist.`)
  } else if ((platform !== 'linux' && !fs.existsSync(path.join(toPath, 'steamapps'))) || (platform === 'linux' && !fs.existsSync(path.join(toPath, 'registry.vdf')))) {
    throw new Error(`${toPath} does not seem to be a valid Steam installation. If it is a new installation login to the client and try again.`)
  }

  this.paths.rootPath = toPath
  this.rootPath = toPath
}

SteamConfig.prototype.loadApps = async function loadApps (apps, entry) {
  let tmp
  try {
    apps = apps.filter((f) => f.indexOf('.acf') !== -1)
    const loadAppFiles = async (f) => {
      try {
        tmp = '' + path.basename(f, '.acf')
        tmp = tmp.substring(tmp.indexOf('_') + 1)
        f = await this.load(this.paths.app(tmp, entry))
      } catch (err) {
        /* istanbul ignore next */
        throw err
      }
      return f
    }
    apps = await asyncMap(apps, loadAppFiles)
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }
  return apps
}

/**
 * Load Steam configuration data files by path and store the data in it's place on this instance of SteamConfig.
 *  The internal function prepareFileNames is used to organize the entries to ensure proper load order.
 *  The internal function afterLoad is run on each file after it's been loaded to automatically
 *    handle cleaning some of the data such as the useless values in `libraryfolders.vdf` and `loginusers.vdf`.
 * @method
 * @async
 * @param {string|Array} entries - A string for a single file/path, or an array for a collection of files/paths.
 * @throws {Error} - If entries is an invalid arg (non-String & non-Array), or any of the entries are not a valid file/path as per SteamPaths.
 */
SteamConfig.prototype.load = async function load (entries) {
  if (typeof entries === 'string') {
    entries = [entries]
  }

  if (typeof entries !== 'object' || entries.constructor !== Array) {
    throw new Error(`${entries} is an invalid arg. Should be a string, or an array of strings.`)
  }

  entries = prepareFilenames(entries)

  try {
    let data
    let tmp
    const loadFilterApps = function (steamapps, data) {
      return steamapps.filter((a) => {
        let result = true

        data.forEach((i) => {
          if (a.AppState.appid === i.AppState.appid) {
            result = false
          }
        })

        return result
      })
    }

    for (let entry of entries) {
      tmp = (path.extname(entry) === '' ? entry.split(/\/|\\/) : path.basename(entry, path.extname(entry)))

      if (typeof tmp === 'object') {
        tmp = tmp[tmp.length - 1]
      }

      if (tmp.indexOf('appmanifest') !== -1) {
        tmp = 'app'
      }

      switch (tmp) {
        case 'app':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          data.library = path.dirname(entry)
          data.path = entry
          return data

        case 'appinfo':
          data = await afs.readFileAsync(entry)
          data = await BVDF.parseAppInfo(data)
          this.appinfo = afterLoad(tmp, data)
          break

        case 'localconfig':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          this.loginusers.users[ this.paths.id64 ].localconfig = afterLoad(tmp, data)
          break

        case 'sharedconfig':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          this.loginusers.users[ this.paths.id64 ].sharedconfig = afterLoad(tmp, data)
          break

        case 'shortcuts':
          if (fs.existsSync(entry)) {
            data = await afs.readFileAsync(entry)
            data = await BVDF.parseShortcuts(data)
            this.loginusers.users[ this.paths.id64 ].shortcuts = afterLoad(tmp, data)
          }
          break

        case 'skins':
          data = fs.readdirSync(entry)
          data = loadSkins(data)
          this.skins = afterLoad(tmp, data)
          break

        case 'steamapps':
          data = fs.readdirSync(entry)
          data = await this.loadApps(data, entry)
          data = afterLoad(tmp, data)
          if (this.appendToApps && this.steamapps.length !== 0) {
            this.steamapps = loadFilterApps(this.steamapps, data)

            this.steamapps = this.steamapps.concat(data)
          } else {
            this.steamapps = data
          }
          break

        case 'config':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          this.config = afterLoad(tmp, data)
          break

        case 'libraryfolders':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          this.libraryfolders = afterLoad(tmp, data)
          break

        case 'loginusers':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          this.loginusers = afterLoad(tmp, data)
          break

        case 'registry':
          if (platform !== 'win32') {
            data = '' + await afs.readFileAsync(path.join(this.paths.rootPath, 'registry.vdf'))
            data = TVDF.parse(data)
          } else if (platform === 'win32') {
            const winreg = new Registry('HKCU\\Software\\Valve\\Steam')
            data = { 'Registry': { 'HKCU': { 'Software': { 'Valve': { 'Steam': {
              'language': await winreg.get('language'),
              'RunningAppID': await winreg.get('RunningAppID'),
              'Apps': await winreg.get('Apps'),
              'AutoLoginUser': await winreg.get('AutoLoginUser'),
              'RememberPassword': await winreg.get('RememberPassword'),
              'SourceModInstallPath': await winreg.get('SourceModInstallPath'),
              'AlreadyRetriedOfflineMode': await winreg.get('AlreadyRetriedOfflineMode'),
              'StartupMode': await winreg.get('StartupMode'),
              'SkinV4': await winreg.get('SkinV4')
            }}}}}}
          }
          this.registry = data
          break

        /* istanbul ignore next */
        default:
          throw new Error(`Cannot load unknown entry type ${tmp} from ${entry}.`)
      }
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }
}

/**
 * Save Steam configuration data files by path, including writing the data to disk.
 * @method
 * @async
 * @param {string|Array} entries - A string for a single file/path, or an array for a collection of files/paths.
 * @throws {Error} - If entries is an invalid arg (non-String & non-Array), or any of the entries are not a valid file/path as per SteamPaths.
 */
SteamConfig.prototype.save = async function save (entries) {
  if (typeof entries === 'string') {
    entries = [entries]
  }

  if (typeof entries !== 'object' || entries.constructor !== Array) {
    throw new Error(`${entries} is an invalid arg. Should be a string, or an array of strings.`)
  }

  try {
    let data
    let tmp
    let tmp2

    for (let entry of entries) {
      tmp = (path.extname(entry) === '' ? entry.split(/\/|\\/) : path.basename(entry, path.extname(entry)))

      if (typeof tmp === 'object') {
        tmp = tmp[tmp.length - 1]
      }

      if (tmp.indexOf('appmanifest') !== -1) {
        tmp = 'app'
      }

      switch (tmp) {
        case 'app':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          tmp2 = '' + entry.substring(entry.indexOf('_') + 1, entry.indexOf('.'))
          tmp = getAppForSave(this.steamapps, tmp2)
          tmp = Object.assign(data, tmp)
          this.steamapps[ tmp2 ] = tmp
          data = TVDF.stringify(tmp, true)
          await afs.writeFileAsync(entry, data)
          break

        case 'config':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          tmp = Object.assign(data, this.config)
          this.config = tmp
          data = TVDF.stringify(tmp, true)
          await afs.writeFileAsync(entry, data)
          break

        case 'loginusers':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          tmp = Object.assign({}, this.strip('loginusers'), data)
          data = TVDF.stringify(tmp, true)
          await afs.writeFileAsync(entry, data)
          break

        case 'registry':
          let winreg
          if (platform !== 'win32') {
            tmp = path.join(this.rootPath, 'registry.vdf')
            data = '' + await afs.readFileAsync(tmp)
            data = TVDF.parse(data)
          } else if (platform === 'win32') {
            tmp = 'winreg'
            winreg = new Registry('HKCU\\Software\\Valve\\Steam')
            data = { 'Registry': { 'HKCU': { 'Software': { 'Valve': { 'Steam': {
              'language': await winreg.get('language'),
              'RunningAppID': await winreg.get('RunningAppID'),
              'Apps': await winreg.get('Apps'),
              'AutoLoginUser': await winreg.get('AutoLoginUser'),
              'RememberPassword': await winreg.get('RememberPassword'),
              'SourceModInstallPath': await winreg.get('SourceModInstallPath'),
              'AlreadyRetriedOfflineMode': await winreg.get('AlreadyRetriedOfflineMode'),
              'StartupMode': await winreg.get('StartupMode'),
              'SkinV4': await winreg.get('SkinV4')
            }}}}}}
          }

          this.registry = Object.assign(data, this.registry)

          if (tmp !== 'winreg') {
            data = TVDF.stringify(this.registry, true)
            await afs.writeFileAsync(tmp, data)
          } else {
            await winreg.set('language', this.registry.Registry.HKCU.Software.Valve.Steam.language)
            await winreg.set('RunningAppID', this.registry.Registry.HKCU.Software.Valve.Steam.RunningAppID)
            await winreg.set('Apps', this.registry.Registry.HKCU.Software.Valve.Steam.Apps)
            await winreg.set('AutoLoginUser', this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser)
            await winreg.set('RememberPassword', this.registry.Registry.HKCU.Software.Valve.Steam.RememberPassword)
            await winreg.set('SourceModInstallPath', this.registry.Registry.HKCU.Software.Valve.Steam.SourceModInstallPath)
            await winreg.set('AlreadyRetriedOfflineMode', this.registry.Registry.HKCU.Software.Valve.Steam.AlreadyRetriedOfflineMode)
            await winreg.set('StartupMode', this.registry.Registry.HKCU.Software.Valve.Steam.StartupMode)
            await winreg.set('SkinV4', this.registry.Registry.HKCU.Software.Valve.Steam.SkinV4)
          }
          break

        case 'localconfig':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          tmp = Object.assign(data, this.loginusers.users[ this.paths.id64 ].localconfig)
          this.loginusers.users[ this.paths.id64 ].localconfig = tmp
          data = TVDF.stringify(tmp, true)
          await afs.writeFileAsync(entry, data)
          break

        case 'sharedconfig':
          data = await afs.readFileAsync(entry)
          data = TVDF.parse('' + data)
          tmp = Object.assign(data, this.loginusers.users[ this.paths.id64 ].sharedconfig)
          this.loginusers.users[ this.paths.id64 ].sharedconfig = tmp
          data = TVDF.stringify(tmp, true)
          await afs.writeFileAsync(entry, data)
          break

        default:
          throw new Error(`Cannot save unknown entry '${entry}'.`)
      }
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }
}

/**
 * Attempt to detect the current user based on the active user, the most recent user, or the only user. Will also set the user if autoSet is true.
 * @method
 * @param {boolean} autoSet=false - Whether to set the user; if undefined or false detected user will be returned.
 * @returns {string} - If autoSet is false and a user is detected, will return the id64 of the detected user.
 * @throws {Error} - If no user is detected.
 */
SteamConfig.prototype.detectUser = function detectUser (autoSet = false) {
  let detected
  let tmp

  try {
    // Get account name of active user from registry if it exists.
    if (this.registry) {
      let user = dp.get(this.registry.Registry.HKCU.Software.Valve.Steam, 'AutoLoginUser')

      if (user) {
        tmp = user
      }
    }

    if (this.loginusers) {
      let keys = Object.keys(this.loginusers.users)

      if (tmp) { // Find id64 of the user that was detected in the registry.
        detected = keys.filter((k) => this.loginusers.users[ k ].AccountName === tmp)[ 0 ] || undefined
      }

      if (!detected && keys.length === 1) { // Detect from the only user.
        detected = keys[ 0 ]
      }

      if (!detected && keys.length !== 1) { // Detect from the most recent user.
        detected = keys.filter((k) => this.loginusers.users[ k ].mostrecent === '1')[ 0 ] || undefined
      }
    }

    if (detected && autoSet) {
      this.setUser(detected)
    } else if (detected) {
      return detected
    } else {
      throw new Error('Could not detect user.')
    }
  } catch (err) {
    throw err
  }
}

/**
 * Attempt to set the current user based on an identifier (id64, accountId, PersonaName, or AccountName).
 * @method
 * @param {string} toUser - The value to detect as the user.
 * @throws {Error} - If loginusers has not been loaded yet, or the user is not found, or there are multiple users found.
 */
SteamConfig.prototype.setUser = function setUser (toUser) {
  let tmp

  try {
    if (typeof toUser !== 'string') {
      toUser = String(toUser)
    }

    Object.keys(this.loginusers.users).forEach((key) => {
      if (key === toUser || this.loginusers.users[ key ].accountId === toUser || this.loginusers.users[ key ].AccountName === toUser || this.loginusers.users[ key ].PersonaName === toUser) {
        tmp = this.loginusers.users[ key ]
      }
    })

    if (!tmp) {
      throw new Error(`${toUser} is an invalid user identifier.`)
    }

    this.currentUser = Object.assign({}, tmp)

    delete this.currentUser.localconfig
    delete this.currentUser.sharedconfig
    delete this.currentUser.shortcuts

    this.paths.id64 = this.currentUser.id64
    this.paths.accountId = this.currentUser.accountId
  } catch (err) {
    throw err
  }
}

/**
 * Strip some data from an internal value based on the name and return the stripped value.
 * @method
 * @param {string} name - The name of the object to strip.
 * @returns {Object} - The stripped value.
 */
SteamConfig.prototype.strip = function (name) {
  // let keys
  let data
  try {
    switch (name) {
      case 'steamapps':
        data = Object.assign([], this.steamapps)
        data.map((a) => {
          delete a.library
          delete a.path
        })
        break

      case 'loginusers':
        data = JSON.parse(JSON.stringify(this.loginusers))
        Object.keys(data.users).forEach((u) => {
          data.users = dp.set(data.users, u, dp.remove(dp.get(data.users, u), 'localconfig'))
          data.users = dp.set(data.users, u, dp.remove(dp.get(data.users, u), 'sharedconfig'))
          data.users = dp.set(data.users, u, dp.remove(dp.get(data.users, u), 'shortcuts'))
        })
        break
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }

  return data
}

module.exports = SteamConfig
