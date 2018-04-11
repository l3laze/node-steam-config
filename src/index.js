/**
 * @module SteamConfig
 * @property {boolean} append - Append loaded apps to this.steamapps if true, or overwrite it if false.
 * @property {Object} paths - An instance of the SteamPaths class.
 *
 * @property {string} appinfo - Value of Binary VDF file appinfo.vdf.
 * @property {string} config - Value of Text VDF file config.vdf.
 * @property {string} libraryfolders - Value of Text VDF file libraryfolders.vdf.
 * @property {string} localconfig - Value of the user-specific Text VDF file localconfig.vdf.
 * @property {string} loginusers - Value of Text VDF file loginusers.vdf.
 * @property {Array} skins - Array of names of skin folders as strings.
 * @property {Array} apps - Array of appmanifest_#.acf (Text VDF) file(s) loaded from Steam Library Folder(s).
 */
'use strict'

const fs = require('fs')
const path = require('path')
const dp = require('dot-property')
const TVDF = require('simple-vdf2')
const BVDF = require('./bvdf.js')
const al = require('./asyncLib.js')
const {Registry} = require('rage-edit')

const platform = require('os').platform()
const aidFromID64 = require('./steamUtils.js').getAccountIdFromId64
let winreg

function SteamConfig () {
  this.append = true
  this.paths = require('./steamPaths.js')

  this.appinfo = []
  this.config = {}
  this.libraryfolders = []
  this.localconfig = {}
  this.loginusers = {}
  this.registry = {}
  this.sharedconfig = {}
  this.shortcuts = []
  this.skins = []
  this.apps = []

  if (platform === 'win32') {
    winreg = new Registry('HKCU\\Software\\Valve\\Steam')
  }

  return this
}

function beforeLoad (files) {
  const first = []
  const last = []

  for (let f of files) {
    if (/loginusers|registry/.test(f)) {
      first.push(f)
    } else {
      last.push(f)
    }
  }

  return first.concat(last)
}

function removeKeys (obj, keys) {
  keys.forEach((k) => {
    obj = dp.remove(obj, k)
  })
  return obj
}

function cleanObject (obj, clean) {
  let listKeys = Object.keys(clean)

  obj = Object.assign({}, obj)
  obj = removeKeys(obj, Object.keys(obj).filter((k) => listKeys.includes(k) === false))

  listKeys.forEach((k) => {
    let val = dp.get(clean, k)

    if (typeof val === 'object') {
      obj = dp.set(obj, k, cleanObject(dp.get(obj, k), val))
    }
  })

  return obj
}

function afterLoad (name, data) {
  const cleaned = require('./cleanSteam.js')

  if (/^(config|localconfig|registry|sharedconfig)/.test(name)) {
    return cleanObject(data, cleaned[ name ])
  } else if (name === 'loginusers') {
    Object.keys(data.users).forEach((u) => {
      data.users = dp.set(data.users, u, dp.remove(dp.get(data.users, u), 'localconfig'))
      data.users = dp.set(data.users, u, dp.remove(dp.get(data.users, u), 'sharedconfig'))
      data.users = dp.set(data.users, u, dp.remove(dp.get(data.users, u), 'shortcuts'))
    })
  }

  return data
}

async function loadApps (appFiles, that) {
  let apps = []

  for (let app of appFiles) {
    apps.push(afterLoad('app', await TVDF.parse('' + await al.readFileAsync(app))))
  }

  if (that.append === true && (typeof that.apps === 'object' && that.apps.constructor.name === 'Array')) {
    that.apps = that.apps.concat(apps.filter((app) => {
      let result = true

      that.apps.forEach((i) => {
        if (i.AppState.appid === app.AppState.appid) {
          result = false
        }
      })

      return result
    }))
  } else {
    that.apps = apps
  }

  return that.apps
}

async function loadWinReg () {
  const winreg = new Registry('HKCU\\Software\\Valve\\Steam')
  return { 'Registry': { 'HKCU': { 'Software': { 'Valve': { 'Steam': {
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

/**
 * @description Attempt to find the user `identifier`.
 * @module SteamConfig
 * @method findUser
 * @async
 * @param {String} identifier - The identifier to use to find the user. Can be Steam ID64, Steam3::account ID, persona name, or account name.
 * @returns {Object} - An object containing `{id64: #, accountId: #}` if the user is found, or an empty object if not.
 */
SteamConfig.prototype.findUser = async function findUser (identifier) {
  const users = this.loginusers.users
  const user = Object.keys(users).filter((u) => {
    return u === identifier ||
      users[ u ].accountId === identifier ||
      users[ u ].AccountName === identifier ||
      users[ u ].PersonaName === identifier
  })[ 0 ]

  if (typeof user !== 'undefined') {
    return {
      id64: user,
      accountId: aidFromID64(user)
    }
  } else {
    return {}
  }
}

/**
 * @description Load Steam configuration data files by path and store the data in it's place on SteamConfig. The internal function beforeLoad is used to organize the entries to ensure proper load order. The internal function afterLoad is run on each file after it's been loaded to automatically handle cleaning some of the data such as the useless values in `libraryfolders.vdf` and `loginusers.vdf`.
 * @module SteamConfig
 * @method load
 * @async
 * @param {Array} files - A string for a single file/path, or an array for a collection of files/paths.
 * @throws {Error} - If entries is an invalid arg (non-String & non-Array), or any of the entries are not a valid file/path as per SteamPaths.
 */
SteamConfig.prototype.load = async function steamConfigLoad (...files) {
  try {
    if ((typeof files[ 0 ] === 'object' && files[ 0 ].constructor.name === 'Array') && files.length === 1) {
      files = files[ 0 ]
    }

    files = beforeLoad(files)

    for (let f of files) {
      if (typeof f === 'string') { // A single file..
        const name = f.replace(/.*?(appinfo|config|libraryfolders|localconfig|loginusers|\/registry|sharedconfig|shortcuts)\.vdf$/, '$1').replace('/', '')

        if (/appinfo/.test(name)) {
          this.appinfo = await BVDF.parseAppInfo(await al.readFileAsync(f))
        } else if (/shortcuts/.test(name)) {
          this.shortcuts = await BVDF.parseShortcuts(await al.readFileAsync(f))
        } else if (/(^config$|libraryfolders|localconfig|loginusers|^registry$|sharedconfig)/.test(name)) {
          this[ name ] = afterLoad(name, await TVDF.parse('' + await al.readFileAsync(f)))
        } else if (/registry.winreg/.test(f)) {
          this.registry = await loadWinReg()
        }
      } else if (typeof f === 'object') { // An array of appmanifest files..
        this.apps = await loadApps(f.apps, this)
      }
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }
}

/**
 * @description Save Steam configuration data files by path.
 * @module SteamConfig
 * @method save
 * @async
 * @param {Array} files - A string for a single file/path, or an array for a collection of files/paths.
 * @throws {Error} - If entries is an invalid arg (non-String & non-Array), or any of the entries are not a valid file/path as per SteamPaths.
 */
SteamConfig.prototype.save = async function steamConfigSave (...files) {
  try {
    if (typeof files[ 0 ] === 'object' && files[ 0 ].constructor.name === 'Array' && files.length === 1) {
      files = files[ 0 ]
    }

    for (let f of files) {
      const name = f.replace(/.*?(\/config|libraryfolders|localconfig|loginusers|\/registry|sharedconfig)\.vdf$/, '$1').replace('/', '')

      if (/(\/config|libraryfolders|localconfig|loginusers|\/registry|sharedconfig)\.vdf/.test(f)) {
        await al.writeFileAsync(this.paths[ name ], await TVDF.stringify(this[ name ], true))
      } else if (/^registry.winreg$/.test(f)) {
        const current = Object.assign(await loadWinReg(), this.registry)
        const winreg = new Registry('HKCU\\Software\\Valve\\Steam')

        await winreg.set('language', current.Registry.HKCU.Software.Valve.Steam.language)
        await winreg.set('RunningAppID', current.Registry.HKCU.Software.Valve.Steam.RunningAppID)
        await winreg.set('Apps', current.Registry.HKCU.Software.Valve.Steam.Apps)
        await winreg.set('AutoLoginUser', current.Registry.HKCU.Software.Valve.Steam.AutoLoginUser)
        await winreg.set('RememberPassword', current.Registry.HKCU.Software.Valve.Steam.RememberPassword)
        await winreg.set('SourceModInstallPath', current.Registry.HKCU.Software.Valve.Steam.SourceModInstallPath)
        await winreg.set('AlreadyRetriedOfflineMode', current.Registry.HKCU.Software.Valve.Steam.AlreadyRetriedOfflineMode)
        await winreg.set('StartupMode', current.Registry.HKCU.Software.Valve.Steam.StartupMode)
        await winreg.set('SkinV4', current.Registry.HKCU.Software.Valve.Steam.SkinV4)

        this.registry = current
      }
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }
}

/**
 * @description Attempt to detect the root installation path based on platform-specific default installation locations, or the value SteamPath from the registry on Windows. Will also set the path if autoSet is true.
 * @module SteamConfig
 * @method detectRoot
 * @async
 * @param {boolean} auto = false - Whether to automatically set the root path; if false the detected path will be returned instead of setting it.
 * @throws {Error} - If the current OS is not supported.
 * @returns {Path} - If autoSet is false: if a path is detected it is returned, otherwise returns null if the default path is not found or does not exist.
 */
SteamConfig.prototype.detectRoot = async function detectRoot (auto = false) {
  let detected

  if (typeof this.registry.Registry === 'undefined') {
    await this.load(this.paths.registry)
  }

  if (platform === 'darwin') {
    detected = path.join(require('os').homedir(), 'Library', 'Application Support', 'Steam')
  } else if (platform === 'linux') {
    detected = path.join(require('os').homedir(), '.steam')
  } else if (platform === 'win32') {
    if (!/64/.test(process.env.PROCESSOR_ARCHITECTURE)) {
      detected = path.join('C:', 'Program Files', 'Steam')
    } else {
      detected = path.join('C:', 'Program Files (x86)', 'Steam')
    }

    if (typeof detected === 'undefined') {
      detected = await winreg.get('SteamPath')
    }
  }

  if (typeof detected !== 'undefined' && auto) {
    this.paths.root = detected
  } else {
    return detected
  }
}

/**
 * @description Attempt to detect the user of the Steam installation from (in order) the active user, the mostrecent user, or the only user.
 * @module SteamConfig
 * @method detectUser
 * @async
 * @param {boolean} auto = false - Whether to automatically set the detected user as the active user of SteamConfig; if false the detected user will be returned instead of setting it.
 * @throws {Error} - If the current OS is not supported.
 * @returns {String} - If auto is false: if a user is detected it is returned, otherwise returns null.
 */
SteamConfig.prototype.detectUser = async function detectUser (auto = false) {
  let detected

  if (typeof this.registry.Registry === 'undefined') {
    await this.load(this.paths.registry)
  }

  if (typeof this.loginusers.users === 'undefined') {
    await this.load(this.paths.loginusers)
  }

  const keys = Object.keys(this.loginusers.users)

  detected = this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser

  if (typeof detected === 'undefined') {
    detected = keys.filter((u) => this.loginusers.users[ u ].mostrecent === '1')[ 0 ]

    if (typeof detected === 'undefined' && keys.length === 1) {
      detected = keys[ 0 ]
    }
  }

  if (typeof detected !== 'undefined') {
    detected = await this.findUser(detected)
  }

  if (typeof detected !== 'undefined' && auto) {
    this.paths.id64 = detected.id64
    this.paths.accountId = detected.accountId
  } else {
    return detected
  }
}

/**
 * @description Attempt to set the root path of the Steam installation.
 * @module SteamConfig
 * @method setRoot
 * @async
 * @param {Path} to - The path to set as the root.
 * @throws {Error} - If to is an invalid path, or if the path is not a valid Steam installation.
 */
SteamConfig.prototype.setRoot = async function setRoot (to) {
  if (typeof to !== 'string' || to === '' || !fs.existsSync(to) ||
    (platform !== 'win32' && !fs.existsSync(path.join(to, 'registry.vdf'))) ||
    (platform === 'win32' && !fs.existsSync(path.join(to, 'skins')))) {
    throw new Error(`${to} is an invalid root path to Steam.`)
  }

  this.paths.root = to
}

/**
 * @description Attempt to set the root path of the Steam installation.
 * @module SteamConfig
 * @method setUser
 * @async
 * @param {Path} to - The path to set as the root.
 * @throws {Error} - If to is an invalid path, or if the path is not a valid Steam installation.
 */
SteamConfig.prototype.setUser = async function setUser (to) {
  if (typeof to !== 'string' || to === '') {
    throw new Error(`${to} is an invalid user identifier. It should be a Steam ID64, Steam3::account ID, account name, or persona name as a string.`)
  }

  to = await this.findUser(to)

  if (typeof to.id64 === 'undefined') {
    throw new Error(`Could not find any user with the identifier ${to}.`)
  }

  this.paths.id64 = to.id64
  this.paths.accountId = to.accountId
}

module.exports = (new SteamConfig())
