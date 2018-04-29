# node-steam-config

> A library for interacting with the Steam client's configuration data.

[![Travis-CI Build Status](https://travis-ci.org/l3laze/node-steam-config.svg?branch=master)](https://travis-ci.org/l3laze/node-steam-config?branch=master) [![AppVeyor Build status](https://ci.appveyor.com/api/projects/status/mhpi0l2hog0lbmuw/branch/master?svg=true)](https://ci.appveyor.com/project/l3laze/node-steam-config/branch/master)

[![Codecov branch](https://img.shields.io/codecov/c/github/l3laze/node-steam-config/master.svg)](https://codecov.io/gh/l3laze/node-steam-config/list/master) [![Codacy branch grade](https://img.shields.io/codacy/grade/6ce28f60d6e64da8bd2c36782fd57973/master.svg)](https://app.codacy.com/app/l3laze/node-steam-config/dashboard)

[![Known Vulnerabilities](https://snyk.io/test/github/l3laze/node-steam-config/badge.svg?targetFile=package.json)](https://snyk.io/test/github/l3laze/node-steam-config?targetFile=package.json)

[![Dependencies](https://img.shields.io/david/l3laze/node-steam-config.svg)](https://github.com/l3laze/node-steam-config/issues) [![Dev Dependencies](https://img.shields.io/david/dev/l3laze/node-steam-config.svg)](https://github.com/l3laze/node-steam-config) [![Peer Dependencies](https://img.shields.io/david/peer/l3laze/node-steam-config.svg)](https://github.com/l3laze/node-steam-config)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)


----


## Warning


This project is in no way affiliated with, authorized, maintained, sponsored or endorsed by Valve or any employees of Valve.


This project is an experimental wrapper that provides an API related to configuration data which may change or be removed entirely at any time at Valve's discretion.


The API uses an internet connection for the methods `requestTags`, `requestGenres`, and `requestOwnedApps`.


----


## Installation


Using [yarn](https://yarnpkg.com/en/) instead of NPM is highly recommended.


`yarn add steamconfig`


Platform specific packages are optionalDependencies, and may require manual install if you have npm configured to not install optional deps by default.


## Usage


```javascript
  const steam = require('steamconfig')

  await steam.detectRoot(true) // Detect & set the root path.
  await steam.load(steam.paths.all.concat(steam.paths.steamapps())) // Load the configuration + installed app data.

  console.info(`Path: ${steam.paths.root}`)
  console.info(`There are ${Object.keys(steam.loginusers.users).length} users associated with this Steam installation.`)
  console.info(`There are ${steam.apps.length} apps installed in the default Steam Library Folder`)

```


For more check out the [examples](./examples) and the [API documentation](./API.md)


----


## Testing


**Note**: All testing except detection of the root path (which will try to find a locally-installed Steam client) is done using dummy data by default.


| Command | Example | Description |
| ---- | ---- | ---- |
| test | `yarn test` | Run all of the scripts from {project root}/test once. |
| test-all | `yarn test-all` | Run the linter, test scripts, and example scripts (using dummy data). |
| test-all-real | `yarn test-all-real` | Run the linter, test scripts, and example scripts (using both real and dummy data). |
| test-mul-nr | `yarn test-mul-nr` | Run the test scripts **10 times**, except those that use the internet. |
| test-examples | `yarn test-examples` | Run the example scripts using dummy data (only on Linux/Mac). |
| test-examples-real | `yarn test-examples-real` | Run the example scripts using a real Steam installation. |


----


## Other Commands From `package.json`


| Command | Example | Description |
| ---- | ---- | ---- |
| lint | `yarn lint` | Run the [StandardJS](https://standardjs.com/) linter. |
| nyct | `yarn nyct` | Run the test scripts with coverage using [NYC](https://github.com/istanbuljs/nyc). |
| htmlcov | `yarn htmlcov` | Create a HTML coverage report from the testing data. |
| docs | `yarn docs` | Generate API.md from the code documentation. |


----


## Contributors

[Owen McDonnell](https://github.com/OwenMcDonnell) of AppVeyor support staff -- bug reports, fixes for .appveyor.yml.


----


## Third-Party Information


This project uses the following third-party packages with their own licenses/requirements. More information can be found at [https://app.fossa.io/reports](https://app.fossa.io/reports/6eadc5ee-ec88-4254-90ef-4c3b356363fb)


#### MIT License
  * [simple-vdf2](https://www.npmjs.com/package/simple-vdf2)
  * [rage-edit](https://www.npmjs.com/package/rage-edit)
  * [node-fetch](https://github.com/bitinn/node-fetch)
  * [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser)
  * [dot-property](https://www.npmjs.com/package/dot-property)
  * [cuint](https://github.com/pierrec/js-cuint)

#### Apache License 2.0
  * [bytebuffer](https://www.npmjs.com/package/bytebuffer)

----


## License


This project is distributed under the [MIT](https://github.com/l3laze/node-steam-config/blob/master/LICENSE.md) license.
