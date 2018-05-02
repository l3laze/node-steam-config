'use strict'

const fs = require('fs')
const path = require('path')
const tvdf = require('simple-vdf2')
const dp = require('dot-property')
const bvdf = require('./bvdf.js')
const al = require('./asyncLib.js')
const {Registry} = require('rage-edit')
const UInt64 = require('cuint').UINT64

const platform = require('os').platform()
const arch = /64/.test(process.env.PROCESSOR_ARCHITECTURE) ? '64' : '86'

async function loadTextVDF (filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`${filePath} does not exist.`)
    }

    const data = '' + await al.readFileAsync(filePath)

    return tvdf.parse(data)
  } catch (err) {
    throw new Error(err)
  }
}

async function saveTextVDF (filePath, data) {
  try {
    data = tvdf.stringify(data, true)
    await al.writeFileAsync(filePath, data)
  } catch (err) {
    throw new Error(err)
  }
}

async function loadBinaryVDF (filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`${filePath} does not exist.`)
    } else if (/appinfo|shortcuts/.test(filePath) === false) {
      throw new Error(`Unknown binary VDF ${filePath}`)
    }

    const data = await al.readFileAsync(filePath)

    if (/appinfo\.vdf/.test(filePath)) {
      return bvdf.parseAppInfo(data)
    } else if (/shortcuts\.vdf/.test(filePath)) {
      return bvdf.parseShortcuts(data)
    }
  } catch (err) {
    throw new Error(err)
  }
}

async function loadSteamWinReg () {
  try {
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
  } catch (err) {
    throw new Error(err)
  }
}

async function saveSteamWinReg (data) {
  try {
    const winreg = new Registry('HKCU\\Software\\Valve\\Steam')

    await winreg.set('language', data.Registry.HKCU.Software.Valve.Steam.language)
    await winreg.set('RunningAppID', data.Registry.HKCU.Software.Valve.Steam.RunningAppID)
    await winreg.set('Apps', data.Registry.HKCU.Software.Valve.Steam.Apps)
    await winreg.set('AutoLoginUser', data.Registry.HKCU.Software.Valve.Steam.AutoLoginUser)
    await winreg.set('RememberPassword', data.Registry.HKCU.Software.Valve.Steam.RememberPassword)
    await winreg.set('SourceModInstallPath', data.Registry.HKCU.Software.Valve.Steam.SourceModInstallPath)
    await winreg.set('AlreadyRetriedOfflineMode', data.Registry.HKCU.Software.Valve.Steam.AlreadyRetriedOfflineMode)
    await winreg.set('StartupMode', data.Registry.HKCU.Software.Valve.Steam.StartupMode)
    await winreg.set('SkinV4', data.Registry.HKCU.Software.Valve.Steam.SkinV4)
  } catch (err) {
    throw new Error(err)
  }
}

function getAccountIdFromId64 (id64) {
  if (typeof id64 !== 'string' || /[^\d]/.test(id64)) {
    throw new Error(`Invalid id64 for getAccountIdFromId64: ${id64} ${typeof id64}. Should be a number as a 'string'.`)
  }

  return '' + ((new UInt64(id64, 10).toNumber() & 0xFFFFFFFF) >>> 0)
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

function reassignObj (target, base) {
  const tkeys = Object.keys(target)

  for (let k of tkeys) {
    if (dp.has(base, k)) {
      if (typeof base[ k ] === 'object' && base[ k ].constructor.name === 'Object') {
        target[ k ] = dp.reassign(target[ k ], base[ k ])
      }
    } else {
      delete target[ k ]
    }
  }

  return target
}

function afterLoad (name, data) {
  const pureConfig = require('./cleanSteam.js')

  try {
    if (/^(config|localconfig|registry|sharedconfig)/.test(name)) {
      data = reassignObj(data, pureConfig[ name ])
    } else if (/libraryfolders/.test(name)) {
      data = Object.keys(data.LibraryFolders).filter((k) => k !== 'TimeNextStatsReport' && k !== 'ContentStatsID')
    }
  } catch (err) {
    throw new Error(err)
  }

  return data
}

function SteamConfig () {
  this.appinfo = {}
  this.config = {}
  this.libraryfolders = {}
  this.localconfig = {}
  this.loginusers = {}
  this.sharedconfig = {}
  this.shortcuts = {}
  this.apps = []

  this.original = {
    appinfo: {},
    config: {},
    libraryfolders: {},
    localconfig: {},
    loginusers: {},
    sharedconfig: {},
    shortcuts: {},
    apps: []
  }

  this.files = require('./steamPaths.js')
}

SteamConfig.prototype.load = async function load (names) {
  try {
    let filePath
    let result

    names = beforeLoad(names)

    for (let name of names) {
      filePath = this.files[ name ]

      if (/appinfo|shortcuts/.test(name)) {
        result = await loadBinaryVDF(filePath)
      } else if (/^config$|libraryfolders|localconfig|loginusers|sharedconfig/.test(name)) {
        result = await loadTextVDF(filePath)
      } else if (/registry/.test(name)) {
        if (platform !== 'win32') {
          result = await loadTextVDF(filePath)
        } else {
          result = await loadSteamWinReg()
        }
      }

      return afterLoad(name, result)
    }
  } catch (err) {
    throw new Error(err)
  }
}

SteamConfig.prototype.loadApps = async function loadApps (fromPath) {
  let apps = []

  try {
    if (!fs.existsSync(fromPath)) {
      throw new Error(`${fromPath} does not exist.`)
    }

    let fp

    apps = fs.readdirSync(fromPath).filter((f) => /appmanifest/.test(f)).map((f) => {
      fp = path.join(fromPath, f)

      f = {
        filePath: fp,
        data: loadTextVDF(fp)
      }

      f.data = afterLoad('appmanifest', f.data)

      return f
    })
  } catch (err) {
    throw new Error(err)
  }

  return apps
}

SteamConfig.prototype.saveApps = async function saveApps (data) {
  try {
    for (let app of data) {
      await saveTextVDF(app.filePath, app.data)
    }
  } catch (err) {
    throw new Error(err)
  }
}

SteamConfig.prototype.save = async function save (names) {
  try {
    let filePath
    let result
    let data

    for (let name of names) {
      filePath = this.files[ name ]
      data = Object.assign({}, this.original[ name ], this[ name ])

      if (/^config$|libraryfolders|localconfig|loginusers|sharedconfig/.test(name)) {
        result = await saveTextVDF(filePath, data)
      } else if (/registry/.test(name)) {
        if (platform !== 'win32') {
          result = await saveTextVDF(filePath, data)
        } else {
          result = await saveSteamWinReg(data)
        }
      }

      return result
    }
  } catch (err) {
    throw new Error(err)
  }
}

const platformPaths = {
  mac: {
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

SteamConfig.prototype.getPath = function getPath (name, root, accountID) {
  try {
    return path.join(root, platformPaths[ platform ][ name ].replace('accountID', accountID))
  } catch (err) {
    throw new Error(err)
  }
}

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
      accountId: getAccountIdFromId64(user)
    }
  } else {
    return undefined
  }
}

SteamConfig.prototype.detectUser = async function detectUser (autoSet = false) {
  const users = Object.keys(this.loginusers.users)
  let user = users.filter((u) => {
    return users[ u ].mostrecent === 1
  })[ 0 ]

  if (user === undefined) {
    user = this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser
  }

  if (user === undefined || user === '') {
    if (users.length === 1) {
      user = users[ 0 ]
    } else {
      user = undefined
    }
  }

  return user
}

module.exports = new SteamConfig()
