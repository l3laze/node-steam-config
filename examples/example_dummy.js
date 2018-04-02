'use strict'

const path = require('path')
const makeDummy = require('steam-dummy')

const pathTo = path.join(__dirname, 'Dummy')

;(async () => {
  try {
    await makeDummy(pathTo, true)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
