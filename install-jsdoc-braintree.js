/*
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 *
 * Downloads a shallow clone (ZIP copy) of the latest version of
 * github.com/braintree/jsdoc-template and extracts it to ./jsdoc-braintree
 *
 */

'use strict'

const path = require('path')
const sevenZip = require('7zip-bin').path7za
const fetch = require('node-fetch')
const spawnSync = require('child_process').spawnSync
const writeFileAsync = require('./lib/asyncLib.js').writeFileAsync
const unlinkAsync = require('./lib/asyncLib.js').unlinkAsync;

(async () => {
  try {
    let filePath = path.join(__dirname, 'master.zip')
    let outPath = path.join(__dirname)
    let data = await fetch('https://github.com/braintree/jsdoc-template/archive/master.zip')

    data = await data.buffer()

    await writeFileAsync(filePath, data)

    spawnSync(sevenZip, ['x', filePath, '-y', '-tzip', `-o${outPath}`])

    await unlinkAsync(filePath)
  } catch (err) {
    throw new Error(err.stderr)
  }
})().catch(function hadError (err) {
  console.error(err)
  process.exit(1)
})
