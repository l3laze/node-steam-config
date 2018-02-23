/* eslint-env mocha */
'use strict'

const SteamSettings = require('../steam-settings.js')
require('chai').should() // eslint-disable-line no-unused-vars

let testData

describe('SteamSettings', function () {
  beforeEach(function () {
    testData = {
      'Registry': {
        'HKCU': {
          'Software': {
            'Valve': {
              'Steam': {
                'language': 'english',
                'AutoLoginUser': 'me',
                'RememberPassword': '1',
                'SkinV4': 'Some Skin Name',
                'AlreadyRetriedOfflineMode': '0'
              }
            }
          }
        }
      },
      'InstallConfigStore': {
        'Software': {
          'Valve': {
            'Steam': {
              'AutoUpdateWindowEnabled': '1',
              'NoSavePersonalInfo': '1',
              'MaxServerBrowserPingsPerMin': '0',
              'DownloadThrottleKbps': '0',
              'AllowDownloadsDuringGameplay': '1',
              'StreamingThrottleEnabled': '1',
              'ClientBrowserAuth': '1',
              'AutoUpdateWindowStart': '0',
              'AutoUpdateWindowEnd': '1'
            },
            'Music': {
              'CrawlSteamInstallFolders': '1',
              'PauseOnVoiceChat': '1',
              'PlaylistNowPlayingNotification': '1',
              'CrawlAtStartup': '1',
              'PauseOnAppStartedProcess': '1',
              'LogCrawling': '1'
            }
          }
        }
      },
      'users': {
        '420': {
          'AccountName': 'somename',
          'PersonaName': 'Some Name',
          'RememberPassword': '1',
          'mostrecent': '1',
          'WantsOfflineMode': '1',
          'SkipOfflineWarning': '1'
        }
      },
      'LibraryFolders': {
        '0': '/Users/tmshvr/Desktop/External Steam Library Folder'
      },
      'AppState': {
        'appid': '420',
        'name': 'Some App',
        'StateFlags': '1024',
        'SizeOnDisk': '1',
        'BytesToDownload': '0',
        'BytesDownloaded': '0',
        'AutoUpdateBehavior': '0',
        'AllowOtherDownloadsWhileRunning': '0'
      },
      'UserLocalConfigStore': {
        'friends': {
          'PersonaStateDesired': '0',
          'VoiceReceiveVolume': '0',
          'Notifications_ShowIngame': '1',
          'Sounds_PlayIngame': '1',
          'Notifications_ShowOnline': '1',
          'Sounds_PlayOnline': '1',
          'Notifications_ShowMessage': '1',
          'Sounds_PlayMessage': '1',
          'AutoSignIntoFriends': '1',
          'ShowTimeInChatLogCheck': '1',
          'AlwaysNewChatWindow': '1',
          'Notifications_EventsAndAnnouncements': '1',
          'Sounds_EventsAndAnnouncements': '1',
          'ChatFlashMode': '1',
          'ShowFriendsPanelInOverlay': '1'
        },
        'streaming_v2': {
          'EnableStreaming': '1',
          'QualityPreference': '1',
          'ChangeDesktopResolution': '1',
          'DynamicallyAdjustResolution': '1',
          'EnableCaptureNVFBC': '1',
          'EnableHardwareEncoding_NVIDIA': '1',
          'EnableHardwareEncoding_AMDV2': '1',
          'EnableHardwareEncoding_Intel': '1',
          'EnableTrafficPriority': '1',
          'SoftwareEncodingThreadCount': '0',
          'EnableHardwareDecodingV2': '1',
          'EnableDebugOverlay': '1',
          'BandwidthLimitKBit': '-1',
          'ResolutionLimit': '0x0',
          'AudioChannels': '2',
          'LastInstallFolderIndex': '0',
          'StartupState.Friends': '1'
        },
        'News': {
          'NotifyAvailableGames': '1'
        },
        'system': {
          'EnableGameOverlay': '1',
          'InGameOverlayShortcutKey': 'Shift KEY_TAB',
          'InGameOverlayScreenshotNotification': '1',
          'InGameOverlayScreenshotPlaySound': '1',
          'InGameOverlayScreenshotSaveUncompressed': '1',
          'InGameOverlayShowFPSContrast': '1',
          'InGameOverlayShowFPSCorner': '0',
          'InGameOverlayScreenshotHotKey': 'KEY_F12',
          'NavUrlBar': '1',
          'displayratesasbits': '1',
          'UsePushToTalk': '1',
          'PushToTalkKey': '42',
          'GameOverlayHomePage': 'https://www.google.com'
        }
      },
      'UserRoamingConfigStore': {
        'Software': {
          'Valve': {
            'Steam': {
              'Apps': {
                '420': {
                  'cloudenabled': '1',
                  'Hidden': '1',
                  'tags': {
                    '0': 'favorite'
                  }
                }
              },
              'SteamDefaultDialog': '#app_games'
            }
          }
        }
      }
    }
  })

  afterEach(function () {
    testData = undefined
  })

  describe('#constructor', function () {
    it('should generate the internal representation of the Steam configuration data', function () {
      let tmp = new SteamSettings()
      tmp.should.have.property('language')
      tmp.should.have.property('AutoLoginUser')
      tmp.should.have.property('RegistryRememberPassword')
      tmp.should.have.property('SkinV4')
    })
  })

  describe('#set', function () {
    it('should be able to set language', function () {
      let tmp = new SteamSettings()
      testData = tmp.set(testData, 'language', 'czech')
      testData.Registry.HKCU.Software.Valve.Steam.language.should.equal('czech')
    })

    it('should be able to set AutoLoginUser', function () {
      let tmp = new SteamSettings()
      testData = tmp.set(testData, 'AutoLoginUser', 'Batman')
      testData.Registry.HKCU.Software.Valve.Steam.AutoLoginUser.should.equal('Batman')
    })

    it('should be able to set RegistryRememberPassword', function () {
      let tmp = new SteamSettings()
      testData = tmp.set(testData, 'RegistryRememberPassword', '0')
      testData.Registry.HKCU.Software.Valve.Steam.RememberPassword.should.equal('0')
    })

    it('should be able to set SkinV4', function () {
      let tmp = new SteamSettings()
      testData = tmp.set(testData, 'SkinV4', 'Batman')
      testData.Registry.HKCU.Software.Valve.Steam.SkinV4.should.equal('Batman')
    })

    it('should be able to set AlreadyRetriedOfflineMode', function () {
      let tmp = new SteamSettings()
      testData = tmp.set(testData, 'AlreadyRetriedOfflineMode', '1')
      testData.Registry.HKCU.Software.Valve.Steam.AlreadyRetriedOfflineMode.should.equal('1')
    })

    it('should throw an error when given invalid arguments', function () {
      let tmp = new SteamSettings()
      try {
        testData = tmp.set(testData, 'language', 'Batman')
      } catch (err) {
        if (err.message.indexOf(' is an invalid value for the setting ') === -1) {
          throw new Error(err)
        }
      }
    })
  })
})
