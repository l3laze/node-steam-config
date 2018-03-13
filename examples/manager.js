'use strict'

const path = require('path')
const SteamConfig = require('../lib/index.js')
const cli = require('cli')
const os = require('os')
const fs = require('fs')
const dp = require('dot-property')
const afs = require('../lib/async-fs.js')

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  path: ['p', 'Path to Steam installation.', 'path', null],
  user: ['u', 'User to switch to by account name or display name.', 'string', null],
  backup: ['b', 'Backup mode', 'boolean', false],
  restore: ['r', 'Restore mode', 'boolean', false]
})

let steam = new SteamConfig()

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

async function init () {
  try {
    if (!options.backup && !options.restore) {
      console.error('No mode set; nothing to do.')
      process.exit(0)
    }

    if (options.path) {
      await steam.setRoot(path.join(options.path))
    } else {
      await steam.detectRoot(true)
    }

    await steam.load([steam.paths.loginusers, steam.paths.registry])

    if (options.user) {
      await steam.setUser(options.user)
    } else {
      await steam.detectUser(true)
    }

    let paths = steam.paths.all.filter(p => p.indexOf('appinfo') === -1 && p.indexOf('skins') === -1 && p.indexOf('libraryfolders') === -1)
    await steam.load(paths)

    if (!options.destination) {
      options.destination = path.join(__dirname, 'data')
    }

    if (!fs.existsSync(options.destination)) {
      await afs.mkdirpAsync(options.destination)
    }
  } catch (err) {
    throw err
  }
}

async function backup () {
  let tmp = steam.loginusers.users[ steam.currentUser.id64 ]

  const cleaned = {
    config: {
      InstallConfigStore: {
        Software: {
          Valve: {
            Steam: {
              AutoUpdateWindowEnabled: '',
              ShaderCacheManager: {
                DisableShaderCache: ''
              },
              Accounts: '*',
              NoSavePersonalInfo: '',
              MaxServerBrowserPingsPerMin: '',
              DownloadThrottleKbps: '',
              AllowDownloadsDuringGameplay: '',
              StreamingThrottleEnabled: '',
              ClientBrowserAuth: ''
            }
          }
        },
        Music: {
          MusicVolume: '',
          CrawlSteamInstallFolders: '',
          PauseOnVoiceChat: '',
          PlaylistNowPlayingNotification: '',
          MusicPlayerVisible: ''
        },
        'CSettingsPanelGameController.Timeout': ''
      }
    },
    localconfig: {
      UserLocalConfigStore: {
        broadcast: {
          Permissions: '',
          FirstTimeComplete: '',
          MaxKbps: '',
          OutputWidth: '',
          OutputHeight: '',
          EncoderSetting: '',
          IncludeDesktop: '',
          RecordSystemAudio: '',
          RecordMic: '',
          ShowDebugInfo: '',
          ShowReminder: '',
          ShowChat: ''
        },
        ParentalSettings: {
          settings: '',
          Signature: ''
        },
        friends: {
          VoiceReceiveVolume: '',
          Notifications_ShowIngame: '',
          Notifications_ShowOnline: '',
          Notifications_ShowMessage: '',
          Notifications_EventsAndAnnouncements: '',
          Sounds_PlayIngame: '',
          Sounds_PlayOnline: '',
          Sounds_PlayMessage: '',
          Sounds_EventsAndAnnouncements: '',
          AutoSignIntoFriends: '',
          ShowTimeInChatLogCheck: '',
          AlwaysNewChatWindow: '',
          ChatFlashMode: '',
          PersonaStateDesired: '',
          ShowAvatars: ''
        },
        'StartupState.Friends': '',
        News: {
          NotifyAvailableGames: ''
        },
        HideSharingNotifications: '',
        system: {
          EnableGameOverlay: '',
          InGameOverlayShortcutKey: '',
          InGameOverlayScreenshotNotification: '',
          InGameOverlayScreenshotPlaySound: '',
          InGameOverlayScreenshotSaveUncompressed: '',
          InGameOverlayShowFPSContrast: '',
          InGameOverlayShowFPSCorner: '',
          InGameOverlayScreenshotHotKey: '',
          NavUrlBar: '',
          displayratesasbits: '',
          UsePushToTalk: '',
          PushToTalkKey: '',
          GameOverlayHomePage: ''
        },
        offline: {
          Ticket: '',
          Signature: ''
        },
        streaming_v2: {
          EnableStreaming: ''
        }
      }
    },
    loginusers: {
      users: '*'
    },
    registry: {
      Registry: {
        HKCU: {
          Software: {
            Valve: {
              Steam: {
                AutoLoginUser: '',
                RememberPassword: '',
                AlreadyRetriedOfflineMode: '',
                language: '',
                StartupMode: '',
                SkinV4: ''
              }
            }
          }
        }
      }
    },
    sharedconfig: {
      UserRoamingConfigStore: {
        Software: {
          Valve: {
            Steam: {
              Apps: '*',
              SteamDefaultDialog: '',
              DesktopShortcutCheck: '',
              StartMenuShortcutCheck: ''
            }
          }
        },
        Web: '*',
        controller_config: '*'
      }
    }
  }

  console.info('Backing up...')

  try {
    let data = {
      arch: os.arch(),
      platform: os.platform(),

      config: cleanObject(steam.config, cleaned.config),
      localconfig: cleanObject(steam.loginusers.users[ steam.currentUser.id64 ].localconfig, cleaned.localconfig),
      registry: cleanObject(steam.registry, cleaned.registry),
      sharedconfig: cleanObject(steam.loginusers.users[ steam.currentUser.id64 ].sharedconfig, cleaned.sharedconfig),
      loginusers: Object.assign({}, steam.strip('loginusers')),
      user: Object.assign({}, {
        AccountName: tmp.AccountName,
        PersonaName: tmp.PersonaName,
        accountId: tmp.accountId,
        id64: tmp.id64
      })
    }

    await afs.writeFileAsync(path.join(options.destination, `backup-${tmp.id64}.json`), JSON.stringify(data, null, 2))
  } catch (err) {
    throw new Error(err)
  }
}

async function restore () {
  let file = path.join(options.destination, `backup-${steam.currentUser.id64}.json`)
  let data

  console.info('Restoring...')

  try {
    data = JSON.parse(await afs.readFileAsync(file))

    steam.config = Object.assign({}, data.config, steam.config)
    steam.loginusers = Object.assign({}, data.loginusers, steam.loginusers)
    steam.registry = Object.assign({}, data.registry, steam.registry)
    steam.loginusers.users[ data.user.id64 ].sharedconfig = Object.assign({}, steam.loginusers.users[ data.user.id64 ].sharedconfig, data.sharedconfig)
    steam.loginusers.users[ data.user.id64 ].localconfig = Object.assign({}, steam.loginusers.users[ data.user.id64 ].localconfig, data.localconfig)
  } catch (err) {
    throw new Error(err)
  }

  await steam.save([steam.paths.config, steam.paths.loginusers, steam.paths.registry, steam.paths.sharedconfig, steam.paths.localconfig])
}

async function run () {
  try {
    await init()

    console.info('User:', steam.currentUser.id64)

    if (options.backup) {
      await backup()
    }

    if (options.restore) {
      await restore()
    }
  } catch (err) {
    throw err
  }

  console.info('Finished')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
