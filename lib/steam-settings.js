'use strict'

const dot = require('./dotProperty.js')

let languages = [
  'bulgarian', 'czech', 'danish', 'dutch', 'english', 'finnish', 'french', 'german',
  'greek', 'hungarian', 'italian', 'japanese', 'koreana', 'norwegian', 'polish',
  'portuguese', 'russian', 'romanian', 'spanish', 'swedish', 'thai', 'turkish',
  'ukrainian', 'brazilian', // Portuguese-Brazil
  'schinese', // Simplified Chinese
  'tchinese' // Traditional Chinese
]

function SettingVal (name, stype, vtype, path, limits) {
  this.name = name
  this.stype = stype
  this.vtype = vtype
  this.path = path
  this.limits = (!limits ? stype === 'boolean' ? [ 0, 1 ] : null : limits)
}

SettingVal.prototype.validate = function (val) {
  let tmp

  switch (this.stype) {
    case 'boolean':
      return (val === '0' || val === '1')

    case 'string':
      return (typeof val === 'string')

    case 'number':
      tmp = parseInt(val)
      return (!isNaN(tmp))

    case 'range':
      val = parseInt(val)

      return (val >= this.limits.min && val <= this.limits.max)

    case 'list':
      return this.limits.includes(val)

    case 'object':
      if (this.vtype === 'key') {
        tmp = Object.keys(this.limits)
        tmp = tmp.indexOf(val)
        return (tmp !== -1)
      } /* istanbul ignore next */ else if (this.vtype === 'value') {
        tmp = Object.values(this.limits)
        tmp = tmp.indexOf(val)
        return (tmp !== -1)
      }
  }
}

function SteamSettings () {
  // registry.vdf
  this.language = new SettingVal('language', 'list', 'value', 'Registry.HKCU.Software.Valve.Steam.language', languages)
  this.AutoLoginUser = new SettingVal('AutoLoginUser', 'string', null, 'Registry.HKCU.Software.Valve.Steam.AutoLoginUser')
  this.SkinV4 = new SettingVal('SkinV4', 'string', null, 'Registry.HKCU.Software.Valve.Steam.SkinV4')
  this.RegistryRememberPassword = new SettingVal('RememberPassword', 'boolean', null, 'Registry.HKCU.Software.Valve.Steam.RememberPassword')
  this.AlreadyRetriedOfflineMode = new SettingVal('AlreadyRetriedOfflineMode', 'boolean', null, 'Registry.HKCU.Software.Valve.Steam.AlreadyRetriedOfflineMode')

  this.lastInstallFolderIndex = new SettingVal('LastInstallFolderIndex', 'number', null, 'UserLocalConfigStore.LastInstallFolderIndex')
  this.personaStateDesired = new SettingVal('PersonaStateDesired', 'object', 'key', 'UserLocalConfigStore.friends.PersonaStateDesired', {
    '0': 'offline',
    '1': 'Online',
    '2': 'Busy',
    '3': 'Away',
    // '4': 'Snooze', -- Not a user option.
    '5': 'Looking to Trade',
    '6': 'Looking to Play'
  })

  this.stateFlags = new SettingVal('StateFlags', 'range', null, null, {min: 0, max: 16719871})

  /*
    // loginusers.vdf
    this.loginusersRememberPassword = new SettingVal('RememberPassword', 'boolean')
    this.wantsOfflineMode = new SettingVal('WantsOfflineMode', 'boolean')
    this.skipOfflineModeWarning = new SettingVal('SkipOfflineModeWarning', 'boolean')

    // config.vdf
    this.autoUpdateWindowEnabled = new SettingVal('AutoUpdateWindowEnabled', 'boolean')
    this.disableShaderCache = new SettingVal('DisableShaderCache', 'boolean')
    this.noSavePersonalInfo = new SettingVal('NoSavePersonalInfo', 'boolean')
    this.MaxServerBrowserPingsPerMin = new SettingVal('MaxServerBrowserPingsPerMin', 'array', [
      0, 5000, 3000, 1500, 1000, 500, 250
    ])
    this.downloadThrottleKbps = new SettingVal('DownloadThrottleKbps', 'object', {
      'None': 0,
      '16 KB/s': 128,
      '32 KB/s': 256,
      '48 KB/s': 384,
      '64 KB/s': 512,
      '96 KB/s': 768,
      '128 KB/s': 1024,
      '192 KB/s': 1536,
      '256 KB/s': 2048,
      '384 KB/s': 3072,
      '512 KB/s': 4096,
      '768 KB/s': 6144,
      '1000 KB/s (1 MB/s)': 8000,
      '1000 KB/s': 8000,
      '1 MB/s': 8000,
      '1.5 MB/s': 12000,
      '2 MB/s': 16000,
      '3 MB/s': 24000,
      '5 MB/s': 40000,
      '7 MB/s': 56000,
      '10 MB/s': 80000,
      '25 MB/s': 200000
    })
    this.allowDownloadsDuringGameplay = new SettingVal('AllowDownloadsDuringGameplay', 'boolean')
    this.streamingThrottleEnabled = new SettingVal('StreamingThrottleEnabled', 'boolean')
    this.clientBrowserAuth = new SettingVal('ClientBrowserAuth', 'boolean')
    this.musicVolume = new SettingVal('MusicVolume', 'range', [0, 100])
    this.crawlSteamInstallFolders = new SettingVal('CrawlSteamInstallFolders', 'boolean')
    this.crawlAtStartup = new SettingVal('CrawlAtStartup', 'boolean')
    this.pauseOnVoiceChat = new SettingVal('PauseOnVoiceChat', 'boolean')
    this.playlistNowPlayingNotification = new SettingVal('PlaylistNowPlayingNotification', 'boolean')
    this.musicPlayerVisible = new SettingVal('MusicPlayerVisible', 'boolean')

    // sharedconfig.vdf
    this.cloudEnabled = new SettingVal('cloudenabled', 'boolean')
    this.hidden = new SettingVal('Hidden', 'boolean')
    this.tags = new SettingVal('tags', 'object')
    this.steamDefaultDialog = new SettingVal('SteamDefaultDialog', 'array', [
      '#app_store',
      '#app_games',
      '#app_news',
      '#app_friends',
      '#steam_menu_friend_activity',
      '#steam_menu_community_home',
      '#app_servers'
    ])

    // localconfig.vdf
    this.personaStateDesired = new SettingVal('PersonaStateDesired', 'object', {
      '0': 'offline',
      '1': 'Online',
      '2': 'Busy',
      '3': 'Away',
      // '4': 'Snooze', -- Not a user option.
      '5': 'Looking to Trade',
      '6': 'Looking to Play'
    })
    this.voiceReceiveVolume = new SettingVal('VoiceReceiveVolume', 'range', [0, 255])
    this.notifications_ShowIngame = new SettingVal('Notifications_ShowIngame', 'boolean')
    this.sounds_PlayIngame = new SettingVal('Sounds_PlayIngame', 'boolean')
    this.notifications_ShowOnline = new SettingVal('Notifications_ShowOnline', 'boolean')
    this.sounds_PlayOnline = new SettingVal('Sounds_PlayOnline', 'boolean')
    this.notifications_ShowMessage = new SettingVal('Notifications_ShowMessage', 'boolean')
    this.sounds_PlayMessage = new SettingVal('sounds_PlayMessage', 'boolean')
    this.autoSignIntoFriends = new SettingVal('AutoSignIntoFriends', 'boolean')
    this.showTimeInChatLogCheck = new SettingVal('ShowTimeInChatLogCheck', 'boolean')
    this.alwaysNewChatWindow = new SettingVal('AlwaysNewChatWindow', 'boolean')
    this.notifications_EventsAndAnnouncements = new SettingVal('Notifications_EventsAndAnnouncements', 'boolean')
    this.sounds_EventsAndAnnouncements = new SettingVal('Sounds_EventsAndAnnouncements', 'boolean')
    this.chatFlashMode = new SettingVal('ChatFlashMode', 'object', {
      '0': 'Always',
      '1': 'Only when minimized',
      '2': 'Never'
    })
    this.showFriendsPanelInOverlay = new SettingVal('ShowFriendsPanelInOverlay', 'boolean')
    this.enableStreaming = new SettingVal('EnableStreaming', 'boolean')
    this.qualityPreference = new SettingVal('QualityPreference', 'object', {
      '1': 'Fast',
      '2': 'Balanced',
      '3': 'Beautiful'
    })
    this.changeDesktopResolution = new SettingVal('ChangeDesktopResolution', 'boolean')
    this.dynamicallyAdjustResolution = new SettingVal('DynamicallyAdjustResolution', 'boolean')
    this.enableCaptureNVFBC = new SettingVal('EnableCaptureNVFBC', 'boolean')
    this.enableHardwareEncoding_NVIDIA = new SettingVal('EnableHardwareEncoding_NVIDIA', 'boolean')
    this.enableHardwareEncoding_AMDV2 = new SettingVal('EnableHardwareEncoding_AMDV2', 'boolean')
    this.enableHardwareEncoding_Intel = new SettingVal('EnableHardwareEncoding_Intel', 'boolean')
    this.enableTrafficPriority = new SettingVal('EnableTrafficPriority', 'boolean')
    this.softwareEncodingThreadCount = new SettingVal('SoftwareEncodingThreadCount', 'object', {
      '0': 'Automatic',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8'
    })
    this.enableHardwareDecodingV2 = new SettingVal('EnableHardwareDecodingV2', 'boolean')
    this.enableDebugOverlay = new SettingVal('EnableDebugOverlay', 'boolean')
    this.bandwidthLimitKBit = new SettingVal('BandwidthLimitKBit', 'object', {
      '-1': 'Automatic (recommended)',
      '3000': '3MBit/s',
      '5000': '5MBit/s',
      '10000': '10MBit/s',
      '50000': '50MBit/s',
      '0': 'Unlimited (increases latency)'
    })
    this.resolutionLimit = new SettingVal('ResolutionLimit', 'object', {
      '0x0': 'Display resolution',
      '1920x1080': '1920x1080 (1080p)',
      '1600x900': '1600x900 (900p)',
      '1280x720': '1280x720 (720p)',
      '852x480': '852x480 (480p)'
    })
    this.audioChannels = new SettingVal('AudioChannels', 'object', {
      '2': 'Stereo',
      '4': 'Quadraphonic (2 front, 2 rear)',
      '6': '5.1 Surround'
    })
    this.lastInstallFolderIndex = new SettingVal('LastInstallFolderIndex', 'number')
    this[ 'StartupState.Friends' ] = new SettingVal('StartupState.Friends', 'boolean')
    this.notifyAvailableGames = new SettingVal('NotifyAvailableGames', 'boolean')
    this.enableGameOverlay = new SettingVal('EnableGameOverlay', 'boolean')
    this.inGameOverlayShortcutKey = new SettingVal('InGameOverlayShortcutKey', 'valvekeycodecombo')
    this.inGameOverlayScreenshotNotification = new SettingVal('InGameOverlayScreenshotNotification', 'boolean')
    this.inGameOverlayScreenshotPlaySound = new SettingVal('InGameOverlayScreenshotPlaySound', 'boolean')
    this.inGameOverlayScreenshotSaveUncompressed = new SettingVal('InGameOverlayScreenshotSaveUncompressed', 'boolean')
    this.inGameOverlayShowFPSContrast = new SettingVal('InGameOverlayShowFPSContrast', 'boolean')
    this.inGameOverlayShowFPSCorner = new SettingVal('InGameOverlayShowFPSCorner', 'object', {
      '0': 'Off',
      '1': 'Top-left',
      '2': 'Top-right',
      '3': 'Bottom-right',
      '4': 'Bottom-left'
    })
    this.inGameOverlayScreenshotHotKey = new SettingVal('InGameOverlayScreenshotHotKey', 'valvekeycode')
    this.navUrlBar = new SettingVal('NavUrlBar', 'boolean')
    this.displayRatesAsBits = new SettingVal('displayratesasbits', 'boolean')
    this.usePushToTalk = new SettingVal('UsePushToTalk', 'boolean')
    this.pushToTalkKey = new SettingVal('PushToTalkKey', 'keycode')
    this.gameOverlayHomePage = new SettingVal('GameOverlayHomePage', 'url')
    this.jumplistSettings = new SettingVal('JumplistSettings', 'number')
    this.jumplistSettingsKnown = new SettingVal('JumplistSettingsKnown', 'number')

    // appmanifest_#.acf
    this.stateFlags = new SettingVal('StateFlags', 'number')
    this.sizeOnDisk = new SettingVal('SizeOnDisk', 'number')
    this.bytesToDownload = new SettingVal('BytesToDownload', 'number')
    this.bytesDownloaded = new SettingVal('BytesDownloaded', 'number')
    this.autoUpdateBehavior = new SettingVal('AutoUpdateBehavior', 'object', {
      '0': 'Always keep this game up to date.',
      '1': 'Only update this game when I launch it.',
      '2': 'High priority - Always auto-update this game before others.'
    })
    this.allowOtherDownloadsWhileRunning = new SettingVal('AllowOtherDownloadsWhileRunning', 'object', {
      '0': 'Follow my global setting ([your global setting])',
      '1': 'Always allow background downloads',
      '2': 'Never allow background downloads'
    })
    this.appmanifestLanguage = new SettingVal('language', 'array', languages)
  */
}

SteamSettings.prototype.set = function set (obj, name, val, path) {
  if (!path && !this[ name ].path) {
    throw new Error('A path to set a value for must be provided.')
  } else if (this[ name ].validate(val)) {
    obj = dot.set(obj, this[ name ].path || /* istanbul ignore next */ path, val)
    return obj
  } else {
    throw new Error(`'${val}' is an invalid value for the setting '${this[ name ].path || /* istanbul ignore next */ path}'.`)
  }
}

module.exports = SteamSettings
