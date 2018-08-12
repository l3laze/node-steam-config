'use strict'

const path = require('path')
const platform = require('os').platform()
const platformPaths = require('./platformPaths.js')

function SteamFiles () {
  let rootPath = platformPaths[ platform ].root
  let id64 = 0
  let accountID = 0

  const obj = {
    get root () {
      return rootPath
    },
    set root (to) {
      rootPath = to
    },
    get id64 () {
      return id64
    },
    set id64 (to) {
      id64 = to
    },
    get accountID () {
      return accountID
    },
    set accountID (to) {
      accountID = to
    },
    get appinfo () {
      return path.join(rootPath, platformPaths[ platform ].appinfo)
    },
    get config () {
      return path.join(rootPath, platformPaths[ platform ].config)
    },
    get libraryfolders () {
      return path.join(rootPath, platformPaths[ platform ].libraryfolders)
    },
    get localconfig () {
      return path.join(rootPath, platformPaths[ platform ].localconfig.replace('accountID', accountID))
    },
    get loginusers () {
      return path.join(rootPath, platformPaths[ platform ].loginusers)
    },
    get registry () {
      return path.join(rootPath, platformPaths[ platform ].registry)
    },
    get sharedconfig () {
      return path.join(rootPath, platformPaths[ platform ].sharedconfig.replace('accountID', accountID))
    },
    get shortcuts () {
      return path.join(rootPath, platformPaths[ platform ].shortcuts.replace('accountID', accountID))
    },
    get steamapps () {
      return path.join(rootPath, platformPaths[ platform ].steamapps)
    },
    get skins () {
      return path.join(rootPath, platformPaths[ platform ].skins)
    },
    set appinfo (to) {
    },
    set config (to) {
    },
    set libraryfolders (to) {
    },
    set localconfig (to) {
    },
    set loginusers (to) {
    },
    set registry (to) {
    },
    set sharedconfig (to) {
    },
    set shorcuts (to) {
    },
    set steamapps (to) {
    },
    set skins (to) {
    }
  }

  return obj
}

module.exports = new SteamFiles()
