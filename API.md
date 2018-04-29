# **`SteamConfig`** API Documentation<br />Version `0.0.3-rc1`

## ------------
### **Table of Contents**
* `Module` [SteamConfig](#module-steamconfig)
  * [Properties](#module-steamconfig-properties)
    * [append](#steamconfig-append)
    * [paths](#steamconfig-paths)
    * [appinfo](#steamconfig-appinfo)
    * [config](#steamconfig-config)
    * [libraryfolders](#steamconfig-libraryfolders)
    * [localconfig](#steamconfig-localconfig)
    * [loginusers](#steamconfig-loginusers)
    * [skins](#steamconfig-skins)
    * [apps](#steamconfig-apps)
    * [original](#steamconfig-original)
  * [Methods](#module-steamconfig-methods)
    * `async` [findUser (identifier)](#steamconfig-finduser)
    * `async` [load (files)](#steamconfig-load)
    * `async` [save (files)](#steamconfig-save)
    * `async` [detectRoot (auto = false)](#steamconfig-detectroot)
    * `async` [detectUser (auto = false)](#steamconfig-detectuser)
    * `async` [setRoot (to)](#steamconfig-setroot)
    * `async` [setUser (to)](#steamconfig-setuser)
* `Module` [SteamPaths](#module-steampaths)
  * [Properties](#module-steampaths-properties)
    * [root](#steampaths-root)
    * [id64](#steampaths-id64)
    * [accountId](#steampaths-accountid)
    * [all](#steampaths-all)
    * [appinfo](#steampaths-appinfo)
    * [config](#steampaths-config)
    * [libraryfolders](#steampaths-libraryfolders)
    * [localconfig](#steampaths-localconfig)
    * [loginusers](#steampaths-loginusers)
    * [registry](#steampaths-registry)
    * [sharedconfig](#steampaths-sharedconfig)
    * [shortcuts](#steampaths-shortcuts)
    * [skins](#steampaths-skins)
  * [Methods](#module-steampaths-methods)
    * [app (id, library)](#steampaths-app)
    * [steamapps (library)](#steampaths-steamapps)
* `Module` [SteamUtils](#module-steamutils)
  * [Methods](#module-steamutils-methods)
    * [getAccountIdFromId64 (id64)](#steamutils-getaccountidfromid64)
    * `async` [requestWithCache (id64, force, cache, site)](#steamutils-requestwithcache)
    * `async` [requestOwnedApps (id64, force, cache)](#steamutils-requestownedapps)
    * `async` [requestTags (force, cache)](#steamutils-requesttags)
    * `async` [requestGenres (appid, force, cache)](#steamutils-requestgenres)
----


<a name='module-steamconfig'></a>
# Module SteamConfig

## ------------

<a name='module-steamconfig-properties'></a>
## Properties

## ------------


| Name | Type | Description |
| --- | --- | --- |
| <a name='steamconfig-append'></a> append | boolean | Append loaded apps to this.steamapps if true, or overwrite it if false.
| <a name='steamconfig-paths'></a> paths | Object | An instance of the SteamPaths class.
| <a name='steamconfig-appinfo'></a> appinfo | string | Value of Binary VDF file appinfo.vdf.
| <a name='steamconfig-config'></a> config | string | Value of Text VDF file config.vdf.
| <a name='steamconfig-libraryfolders'></a> libraryfolders | string | Value of Text VDF file libraryfolders.vdf.
| <a name='steamconfig-localconfig'></a> localconfig | string | Value of the user-specific Text VDF file localconfig.vdf.
| <a name='steamconfig-loginusers'></a> loginusers | string | Value of Text VDF file loginusers.vdf.
| <a name='steamconfig-skins'></a> skins | Array | Array of names of skin folders as strings.
| <a name='steamconfig-apps'></a> apps | Array | Array of appmanifest_#.acf (Text VDF) file(s) loaded from Steam Library Folder(s).
| <a name='steamconfig-original'></a> original | Object | Settings as loaded from files without being cleaned. To help when restoring data.
## ------------

<a name='module-steamconfig-methods'></a>
## Methods

## ------------

<a name='steamconfig-finduser'></a>
#### `async`  findUser (identifier) 

Attempt to find the user `identifier`.
> **Arguments**

* `identifier` *is a* `String` - The identifier to use to find the user. Can be Steam ID64, Steam3::account ID, persona name, or account name.


> **Returns**

* `Object` - An object containing `{id64: #, accountId: #}` if the user is found, or an empty object if not.


## ------------

<a name='steamconfig-load'></a>
#### `async`  load (files) 

Load Steam configuration data files by path and store the data in it's place on SteamConfig. The internal function beforeLoad is used to organize the entries to ensure proper load order. The internal function afterLoad is run on each file after it's been loaded to automatically handle cleaning some of the data such as the useless values in `libraryfolders.vdf` and `loginusers.vdf`.
> **Arguments**

* `files` *is a* `Array` - A string for a single file/path, or an array for a collection of files/paths.


> **Throws**

* `Error` - If entries is an invalid arg (non-String & non-Array), or any of the entries are not a valid file/path as per SteamPaths.


## ------------

<a name='steamconfig-save'></a>
#### `async`  save (files) 

Save Steam configuration data files by path.
> **Arguments**

* `files` *is a* `Array` - A string for a single file/path, or an array for a collection of files/paths.


> **Throws**

* `Error` - If entries is an invalid arg (non-String & non-Array), or any of the entries are not a valid file/path as per SteamPaths.


## ------------

<a name='steamconfig-detectroot'></a>
#### `async`  detectRoot (auto = false) 

Attempt to detect the root installation path based on platform-specific default installation locations. Will also set the path if autoSet is true.
> **Arguments**

* `auto` = false *is a* `boolean` - Whether to automatically set the root path; if false the detected path will be returned instead of setting it.


> **Returns**

* `Path` - If autoSet is false: if a path is detected it is returned, otherwise returns null if the default path is not found or does not exist.


> **Throws**

* `Error` - If the current OS is not supported.


## ------------

<a name='steamconfig-detectuser'></a>
#### `async`  detectUser (auto = false) 

Attempt to detect the user of the Steam installation from (in order) the active user, the mostrecent user, or the only user.
> **Arguments**

* `auto` = false *is a* `boolean` - Whether to automatically set the detected user as the active user of SteamConfig; if false the detected user will be returned instead of setting it.


> **Returns**

* `String` - If auto is false: if a user is detected it is returned, otherwise returns null.


> **Throws**

* `Error` - If the current OS is not supported.


## ------------

<a name='steamconfig-setroot'></a>
#### `async`  setRoot (to) 

Attempt to set the root path of the Steam installation.
> **Arguments**

* `to` *is a* `Path` - The path to set as the root.


> **Throws**

* `Error` - If to is an invalid path, or if the path is not a valid Steam installation.


## ------------

<a name='steamconfig-setuser'></a>
#### `async`  setUser (to) 

Attempt to set the root path of the Steam installation.
> **Arguments**

* `to` *is a* `Path` - The path to set as the root.


> **Throws**

* `Error` - If to is an invalid path, or if the path is not a valid Steam installation.


## ------------
----


<a name='module-steampaths'></a>
# Module SteamPaths

## ------------

<a name='module-steampaths-properties'></a>
## Properties

## ------------


| Name | Type | Description |
| --- | --- | --- |
| <a name='steampaths-root'></a> root | Path | The root of the Steam installation.
| <a name='steampaths-id64'></a> id64 | Number | The current user's Steam ID64.
| <a name='steampaths-accountid'></a> accountId | Number | The current user's Steam3::account ID
| <a name='steampaths-all'></a> all | Array | All of the configuration file paths except steamapps skins.
| <a name='steampaths-appinfo'></a> appinfo | Object | Path to the file appinfo.vdf.
| <a name='steampaths-config'></a> config | Object | Path to the file config.vdf.
| <a name='steampaths-libraryfolders'></a> libraryfolders | Object | Path to the file libraryfolders.vdf.
| <a name='steampaths-localconfig'></a> localconfig | Object | Path to the user-specific file localconfig.vdf.
| <a name='steampaths-loginusers'></a> loginusers | Object | Path to the file loginusers.vdf.
| <a name='steampaths-registry'></a> registry | Object | Path to the file registry.vdf (or it's equivalent from the Registry on Windows).
| <a name='steampaths-sharedconfig'></a> sharedconfig | Object | Path to the user-specific file sharedconfig.vdf (or  Registry on Windows).
| <a name='steampaths-shortcuts'></a> shortcuts | Object | Path to the user-specific file shortcuts.vdf.
| <a name='steampaths-skins'></a> skins | Object | Path to the skins folder.
## ------------

<a name='module-steampaths-methods'></a>
## Methods

## ------------

<a name='steampaths-app'></a>
####  app (id, library) 

Get the path to a Steam app.
> **Arguments**

* `id` *is a* `string` - The Steam appid of the app to load.


* `library` *is a* `Path` - The path to the Steam Library Folder to load the app from.  If undefined it will use the default folder.


## ------------

<a name='steampaths-steamapps'></a>
####  steamapps (library) 

Get the paths to all of the Steam apps in a Steam Library Folder.
> **Arguments**

* `library` *is a* `Path` - The path to the Steam Library Folder to load. If undefined it will use the default folder.


## ------------
----


<a name='module-steamutils'></a>
# Module SteamUtils

## ------------

<a name='module-steamutils-methods'></a>
## Methods

## ------------

<a name='steamutils-getaccountidfromid64'></a>
####  getAccountIdFromId64 (id64) 

Get the Steam3::account ID from a Steam ID64 value.
> **Arguments**

* `id64` *is a* `Number` - The id64 to get the accountId from.


> **Returns**

* `Number` - The accountId of the id64.


> **Throws**

* `Error` - If argument `id64` is invalid.


* `Error` - To propagate errors


## ------------

<a name='steamutils-requestwithcache'></a>
#### `async`  requestWithCache (id64, force, cache, site) 

Request a webpage and optionally cache results.
> **Arguments**

* `id64` *is a* `Number` - The id64 to get the accountId from.


* `force` *is a* `Boolean` - Force to get a fresh copy of the requested data.


* `cache` *is a* `Object` - An object of the format {enabled: true|false, folder: path to cache folder, file: path to cache file}


* `site` *is a* `string` - The site to request the data from.


> **Returns**

* `string` - The requested data if found/received.


> **Throws**

* `Error` - If `requestFunc` is not an async function.


* `Error` - To propagate errors


## ------------

<a name='steamutils-requestownedapps'></a>
#### `async`  requestOwnedApps (id64, force, cache) 

Request the list of owned apps on Steam for a given Steam ID64.
> **Arguments**

* `id64` *is a* `Number` - The id64 to get the accountId from.


* `force` *is a* `Boolean` - Force to get a fresh copy of the requested data.


* `cache` *is a* `Object` - An object of the format {enabled: true|false, folder: path to cache folder, file: path to cache file}


> **Returns**

* `Array` - An array objects, each representing a single owned app for the account `id64`.


> **Throws**

* `Error` - If argument `id64` is invalid.


* `Error` - To propagate errors


## ------------

<a name='steamutils-requesttags'></a>
#### `async`  requestTags (force, cache) 

Request the list of popular tags on Steam.
> **Arguments**

* `force` *is a* `Boolean` - Force to get a fresh copy of the requested data.


* `cache` *is a* `Object` - An object of the format {enabled: true|false, folder: path to cache folder, file: path to cache file}


> **Returns**

* `Array` - An array of key: val pairs of tag names and their ID's.


> **Throws**

* `Error` - To propagate errors.


## ------------

<a name='steamutils-requestgenres'></a>
#### `async`  requestGenres (appid, force, cache) 

Request the list of genres for an app on Steam.
> **Arguments**

* `appid` *is a* `Number` - The Steam appid of the app to request genres for.


* `force` *is a* `Boolean` - Force to get a fresh copy of the requested data.


* `cache` *is a* `Object` - An object of the format {enabled: true|false, folder: path to cache folder, file: path to cache file}


> **Returns**

* `Array` - The genres from the app's Steam store page.


> **Throws**

* `Error` - If argument `appid` is invalid.


* `Error` - To propagate errors


## ------------
----
## Generated by [Doccomment.js](https://github.com/l3laze/Doccomment)...so, that's great and stuff.