'use strict'

module.exports = {
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
