'use strict'

const path = require('path')
const dp = require('dot-property')
const TVDF = require('simple-vdf2')
const BVDF = require('./bvdf.js')
const al = require('./asyncLib.js')
const {Registry} = require('rage-edit')

const platform = require('os').platform()
const arch = require('os').arch()
const aidFromID64 = require('./steam-utils.js').getAccountIdFromId64
let winreg

function SteamConfig () {
  this.append = true
  this.paths = require('./paths.js')

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
  const cleaned = require('./clean-steam.js')

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

async function findUser (identifier, users) {
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

SteamConfig.prototype.load = async function steamConfigLoad (...files) {
  try {
    if ((typeof files[ 0 ] === 'object' && files[ 0 ].constructor.name === 'Array') && files.length === 1) {
      files = files[ 0 ]
    }

    files = beforeLoad(files)

    for (let f of files) {
      if (typeof f === 'string') { // A single file..
        const name = f.replace(/.*?(config|libraryfolders|localconfig|loginusers|registry|sharedconfig)\.vdf$/, '$1')

        if (/appinfo/.test(name)) {
          this.appinfo = await BVDF.parseAppInfo(await al.readFileAsync(f))
        } else if (/shortcuts/.test(name)) {
          this.shortcuts = await BVDF.parseShortcuts(await al.readFileAsync(f))
        } else if (/(^config|libraryfolders|localconfig|loginusers|^registry$|sharedconfig)/.test(name)) {
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

SteamConfig.prototype.save = async function steamConfigSave (...files) {
  if ((typeof files[ 0 ] === 'object' && files[ 0 ].constructor.name === 'Array') && files.length === 1) {
    files = files[ 0 ]
  }

  try {
    for (let f of files) {
      const name = f.replace(/.*?(config|libraryfolders|localconfig|loginusers|^registry$|sharedconfig)\.vdf$/, '$1')

      if (name !== f) {
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

SteamConfig.prototype.detectRoot = async function detectRoot (auto = false) {
  let detected

  if (platform === 'darwin') {
    detected = path.join(require('os').homedir(), 'Library', 'Application Support', 'Steam')
  } else if (platform === 'linux') {
    detected = path.join(require('os').homedir(), '.steam')
  } else if (platform === 'win32') {
    if (arch === 'ia32') {
      detected = path.join('C:', 'Program Files', 'Steam')
    } else if (arch === 'ia64') {
      detected = path.join('C:', 'Program Files (x86)', 'Steam')
    }

    if (typeof detected === 'undefined') {
      detected = await winreg.get('InstallPath')
    }
  }

  if (typeof detected !== 'undefined' && auto) {
    this.paths.root = detected
  } else {
    return detected
  }
}

SteamConfig.prototype.detectUser = async function detectUser (auto = false) {
  let detected

  if (typeof this.registry.Registry === 'undefined') {
    await this.load(this.paths.registry)
  } else if (typeof this.loginusers.users === 'undefined') {
    await this.load(this.paths.loginusers)
  }

  const keys = Object.keys(this.loginusers.users)

  detected = this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser || detected

  if (typeof detected === 'undefined') {
    detected = keys.filter((u) => this.loginusers.users[ u ].mostrecent === '1')[ 0 ]

    if (typeof detected === 'undefined' && keys.length === 1) {
      detected = keys[ 0 ]
    }
  }

  if (typeof detected !== 'undefined') {
    detected = await findUser(detected, this.loginusers.users)
  }

  if (typeof detected !== 'undefined' && auto) {
    this.paths.id64 = detected.id64
    this.paths.accountId = detected.accountId
  } else {
    return detected
  }
}

SteamConfig.prototype.setRoot = async function setRoot (to) {
  this.paths.root = to
}

SteamConfig.prototype.setUser = async function setRoot (to) {
  if ((typeof to === 'string' && to.replace(/(\d+)/, '') !== '') ||
    (typeof to !== 'object' && typeof to.id64 === 'undefined')) {
    throw new Error(`${to} is an invalid user object. It should be an id64 as a string, or an object with an id64 [and optionally an accountId].`)
  }

  this.paths.id64 = typeof to === 'string' ? to : to.id64

  if (typeof to.accountId === 'undefined') {
    this.paths.accountId = aidFromID64(this.paths.id64)
  }
}

module.exports = (new SteamConfig())
