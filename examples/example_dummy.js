/* eslint-env mocha */
'use strict'

const path = require('path')
const Dummy = require('steam-dummy')

const pathTo = path.join(__dirname, 'Dummy')
const dummy = new Dummy()

dummy.makeDummy(pathTo, true).then(() => {
  console.info(`Dummy created for examples @ ${pathTo}`)
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
