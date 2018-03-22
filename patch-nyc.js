'use strict'

const afs = require('./lib/async-fs.js')
const path = require('path')
const patch = require('./patch-file.js').patch
const nycp = path.join('./', 'node_modules', 'nyc', 'bin', 'nyc.js')

let data

(async () => {
  data = '' + await afs.readFileAsync(nycp)
  data = patch(data, 'if (argv._[0] === \'report\') {', 'if (argv._[0] === \'version\') {\n  console.info(`${' + 'require(\'./../../package.json\').version}`)\n} else ')

  await afs.writeFileAsync(nycp, data)
})()
