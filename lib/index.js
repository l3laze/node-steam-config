/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 *
 * @requires {@link https://www.npmjs.com/package/cuint|cuint}
 * @requires {@link https://www.npmjs.com/package/bluebird|bluebird}
 * @requires {@link https://www.npmjs.com/package/rage-edit|rage-edit}
 * @requires {@link https://www.npmjs.com/package/simple-vdf2|simple-vdf2}
 * @requires {@link https://www.npmjs.com/package/web-request|web-request}
 * @requires {@link https://www.npmjs.com/package/fast-xml-parser|fast-xml-parser}
 */

'use strict'

const fs = require('bluebird').Promise.promisifyAll(require('fs'))
const path = require('path')
const TVDF = require('simple-vdf2')
const BVDF = require('./bvdf.js')
const {Registry} = require('rage-edit')
const SteamPaths = require('./steam-paths.js')

const home = require('os').homedir()
const arch = require('os').arch()
const platform = require('os').platform()

const getAccountId = require('./steamdata-utils.js').getAccountIdFromId64

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
 * @property {object} winreg          - An instance of rage-edit's Registry class.
 * @property {object} paths           - An instance of the SteamPaths class.
 * @property {boolean} appendToApps   - Append loaded apps to this.steamapps, or overwrite it.
 *
 * @property {string} registry        - Windows Registry, or Text VDF file Steam/registry.vdf on Linux/Mac.
 * @property {string} config          - Value of Text VDF file Steam/config/config.vdf.
 * @property {string} loginusers      - Value of Text VDF file Steam/config/loginusers.vdf.
 * @property {string} libraryfolders  - Value of Text VDF file Steam/steamapps/libraryfolders.vdf.
 * @property {string} appinfo         - Value of Binary VDF file Steam/appcache/appinfo.vdf.
 * @property {array} skins            - Array of names of skin folders as strings.
 * @property {array} steamapps        - Array of appmanifest_#.acf Text VDF file(s) loaded from Steam Library Folder(s).
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
 * @param {Boolean} autoSet=false - Whether to set the root path; if undefined or false detected path will be returned.
 * @throws {Error} - If the current OS is not supported.
 * @returns {Path} - If autoSet is false: if a path is detected it is returned, otherwise returns null if the default path is not found or does not exist.
 */
SteamConfig.prototype.detectRoot = function detectRoot (autoSet = false) {
  let detected

  switch (platform) {
    case 'darwin':
      detected = path.join(home, 'Library', 'Application Support', 'Steam')
      break

    case 'linux':
      detected = path.join(home, '.steam', 'steam')
      break

    case 'win32':
      if (arch === 'ia32') {
        detected = path.join('C:\\', 'Program Files (x86)', 'Steam')
      } else {
        detected = path.join('C:\\', 'Program Files', 'Steam')
      }

      if (!fs.existsSync(detected)) {
        (async () => {
          detected = await (new Registry('HKLM\\Software\\Valve\\Steam')).get('InstallPath') || null
        })()
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

SteamConfig.prototype.loadApps = function loadApps (apps, entry) {
  let tmp
  apps = apps.filter((f) => f.indexOf('.acf') !== -1)
  return apps.map(async (f) => {
    tmp = '' + path.basename(f, '.acf')
    tmp = tmp.substring(tmp.indexOf('_') + 1)
    f = await this.load(this.paths.app(tmp, entry))
    return f
  })
}

/**
 * Load a/some Steam files by path, including storing the data in it's place on this instance of SteamConfig.
 *  Pre-processes arguments using the internal function prepareFileNames to ensure proper load order.
 *  The internal function afterLoad is run on each file after it's been loaded to automatically
 *    handle cleaning some of the data such as the useless values in `libraryfolders.vdf` and `loginusers.vdf`.
 * @method
 * @async
 * @param {String|Array} entries - A string for a single file/path, or an array for a collection of files/paths.
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
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          data.library = path.dirname(entry)
          data.path = entry
          return data

        case 'appinfo':
          data = await fs.readFileAsync(entry)
          data = await BVDF.parseAppInfo(data)
          this.appinfo = afterLoad(tmp, data)
          break

        case 'localconfig':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          this.loginusers.users[ this.paths.id64 ].localconfig = afterLoad(tmp, data)
          break

        case 'sharedconfig':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          this.loginusers.users[ this.paths.id64 ].sharedconfig = afterLoad(tmp, data)
          break

        case 'shortcuts':
          data = await BVDF.parseShortcuts(await fs.readFileAsync(entry))
          this.loginusers.users[ this.paths.id64 ].shortcuts = afterLoad(tmp, data)
          break

        case 'skins':
          data = loadSkins(fs.readdirSync(entry))
          this.skins = afterLoad(tmp, data)
          break

        case 'steamapps':
          data = this.loadApps(fs.readdirSync(entry), entry)
          data = await Promise.all(data)
          data = afterLoad(tmp, data)
          if (this.appendToApps && this.steamapps) {
            this.steamapps = this.steamapps.filter(function loadFilterApps (a) {
              let result = true

              for (tmp = 0; tmp < data.length; tmp += 1) {
                if (a.AppState.appid === data[ tmp ].AppState.appid) {
                  result = false
                }
              }

              return result
            })

            this.steamapps = this.steamapps.concat(data)
          } else {
            this.steamapps = data
          }
          break

        case 'config':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          this.config = afterLoad(tmp, data)
          break

        case 'libraryfolders':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          this.libraryfolders = afterLoad(tmp, data)
          break

        case 'loginusers':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          this.loginusers = afterLoad(tmp, data)
          break

        case 'registry':
          if (platform === 'darwin') {
            data = '' + await fs.readFileAsync(path.join(this.paths.rootPath, 'registry.vdf'))
            data = await TVDF.parse(data)
          } else if (platform === 'linux') {
            data = '' + await fs.readFileAsync(path.join(this.paths.rootPath, '..', 'registry.vdf'))
            data = await TVDF.parse(data)
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
    throw new Error(err)
  }
}

/**
 * Save a/some SteamConfig data by path, including writing the data to disk.
 *  Pre-processes arguments using the internal function prepareFileNames to ensure proper save order.
 * @method
 * @async
 * @param {String|Array} entries - A string for a single file/path, or an array for a collection of files/paths.
 * @throws {Error} - If entries is an invalid arg (non-String & non-Array), or any of the entries are not a valid file/path as per SteamPaths.
 */
SteamConfig.prototype.save = async function save (entries) {
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
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          tmp2 = '' + entry.substring(entry.indexOf('_') + 1, entry.indexOf('.'))
          tmp = getAppForSave(this.steamapps, tmp2)
          tmp = Object.assign(data, tmp)
          this.steamapps[ tmp2 ] = tmp
          await fs.writeFileAsync(entry, TVDF.stringify(tmp, true))
          break

        case 'config':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          tmp = Object.assign(data, this.config)
          this.config = tmp
          await fs.writeFileAsync(entry, TVDF.stringify(tmp, true))
          break

        case 'loginusers':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          tmp = Object.assign(data, this.loginusers)
          await fs.writeFileAsync(entry, TVDF.stringify(tmp, true))
          break

        case 'registry':
          let winreg
          if (platform !== 'win32') {
            tmp = path.join(this.rootPath, 'registry.vdf')
            data = '' + await fs.readFileAsync(tmp)
            data = await TVDF.parse(data)
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
            await fs.writeFileSync(tmp, TVDF.stringify(this.registry, true))
          } else {
            await winreg.set('language')
            await winreg.set('RunningAppID')
            await winreg.set('Apps')
            await winreg.get('AutoLoginUser')
            await winreg.get('RememberPassword')
            await winreg.get('SourceModInstallPath')
            await winreg.get('AlreadyRetriedOfflineMode')
            await winreg.get('StartupMode')
            await winreg.get('SkinV4')
          }
          break

        case 'localconfig':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          tmp = Object.assign(data, this.loginusers.users[ this.paths.id64 ].localconfig)
          this.loginusers.users[ this.paths.id64 ].localconfig = tmp
          await fs.writeFileAsync(entry, TVDF.stringify(tmp, true))
          break

        case 'sharedconfig':
          data = await TVDF.parse('' + await fs.readFileAsync(entry))
          tmp = Object.assign(data, this.loginusers.users[ this.paths.id64 ].sharedconfig)
          this.loginusers.users[ this.paths.id64 ].sharedconfig = tmp
          await fs.writeFileAsync(entry, TVDF.stringify(tmp, true))
          break

        default:
          throw new Error(`Cannot save unknown entry '${entry}'.`)
      }
    }
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * Attempt to detect the current user based on the active user, the most recent user, or the only user. Will also set the user if autoSet is true.
 * @method
 * @param {Boolean} autoSet=false - Whether to set the user; if undefined or false detected user will be returned.
 * @returns {String} - If autoSet is false and a user is detected, will return the id64 of the detected user.
 * @throws {Error} - If no user is detected.
 */
SteamConfig.prototype.detectUser = function detectUser (autoSet = false) {
  let detected

  if (this.loginusers) {
    let keys = Object.keys(this.loginusers.users)

    if (keys.length === 1) {
      detected = keys[ 0 ]
    } else {
      detected = keys.filter((k) => this.loginusers.users[ k ].mostrecent === '1')[ 0 ] || null
    }
  }

  if (detected && autoSet) {
    this.setUser(detected)
  } else if (detected) {
    return detected
  } else {
    throw new Error('Could not detect user.')
  }
}

/**
 * Attempt to set the current user based on an identifier (detected from id64, accountId, PersonaName, or AccountName).
 * @method
 * @param {String} identifier - The value to detect as the user.
 * @throws {Error} - If loginusers has not been loaded yet, or the user is not found, or there are multiple users found.
 */
SteamConfig.prototype.setUser = function setUser (toUser) {
  let tmp

  Object.keys(this.loginusers.users).forEach((key) => {
    if (key === toUser || this.loginusers.users.accountId === toUser || this.loginusers.users[ key ].AccountName === toUser || this.loginusers.users[ key ].PersonaName === toUser) {
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
}

/**
 * Strip some data from an internal value based on the name and return the stripped value.
 * @method
 * @param {String} name - The name of the object to strip.
 * @returns {Object} - The stripped value.
 */
SteamConfig.prototype.strip = function (name) {
  // let keys
  let data

  switch (name) {
    case 'steamapps':
      data = Object.assign([], this.steamapps)
      data.map((a) => {
        delete a.library
        delete a.path
      })
      break

      /*
        case 'loginusers':
          data = Object.assign({}, this.loginusers)
          keys = Object.keys(data)
          keys.forEach(u => {
            delete data[ u ].localconfig
            delete data[ u ].sharedconfig
            delete data[ u ].shortcuts
          })
          break
       */
  }

  return data
}

module.exports = SteamConfig
