'use strict'
/**
 * @module bvdf
 */

// Based on [seishun's node-steam/lib/VDF.js](https://github.com/seishun/node-steam).

const ByteBuffer = require('bytebuffer')

/**
 * @package
 * @enum {number}
 * @property {number} None - No type/start of table/end of data value.
 * @property {number} String - Null-terminated string value.
 * @property {number} Int32 - A 32-bit int value.
 * @property {number} Float32 - A 32-bit float value.
 * @property {number} WideString - A null-terminated string value (should be double-null?)
 * @property {number} Color - An RGB color as a 32-bit int value.
 * @property {number} UInt64 - A 64-bit int value.
 * @property {number} End - End of table/end of data value.
 */
const Type = {
  None: 0,
  String: 1,
  Int32: 2,
  Float32: 3,
  Pointer: 4,
  WideString: 5,
  Color: 6,
  UInt64: 7,
  End: 8
}

/**
 * Parse the binary VDF data of buffer.
 * @function
 * @param {ByteBuffer} data - The data to parse.
 * @returns {Object} - The parsed data as a JS object.
 * @throws {Error} - If there is an error parsing the data.
 */
async function decode (buffer) {
  let object = {}
  let done = false

  try {
    do {
      let type = buffer.readUint8()

      if (type === Type.End) {
        done = true
        break
      }

      let name = buffer.readCString()

      /*
        if (type === Type.None && !name && !Object.keys(object).length) {
          name = buffer.readCString()
        }
      */

      switch (type) {
        case Type.None:
          object[name] = await decode(buffer)
          break

        case Type.String:
        case Type.WideString:
          object[name] = buffer.readCString()
          break

        case Type.Int32:
        case Type.Color:
        case Type.Pointer:
          object[name] = buffer.readInt32()
          break

        /* istanbul ignore next */
        case Type.UInt64:
          object[name] = buffer.readUint64()
          break

        /* istanbul ignore next */
        case Type.Float32:
          object[name] = buffer.readFloat()
          break
      }
    } while (!done)
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }
  return object
}

/**
 * Convert parts of data to another type/value -- Timestamp, Boolean, Array, etc.
 * @function
 * @param {string|Buffer} data - The file data to parse.
 * @param {DataConversion} conversion - The conversions to apply to data.
 * @returns {Array} - An array of appinfo entries as anonymous Objects.
 * @throws {Error} - If there is an error parsing the data.
 */
/* istanbul ignore next */
function convertData (data, conversion) {
  try {
    for (let bool of conversion.booleans) {
      data.map((item) => {
        item[ bool ] = (item[ bool ] === 1)

        return item
      })
    }

    for (let time of conversion.timestamps) {
      data.map((item) => {
        /* istanbul ignore next */
        if (item[ time ] === 0) {
          item[ time ] = 'Never'
          return item
        } else {
          item[ time ] = new Date(item[ time ] * 1000).toString()
          return item
        }
      })
    }

    for (let list of conversion.arrays) {
      data.map((item) => {
        item[ list ] = Object.values(item[ list ])

        return item
      })
    }
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }

  return data
}

/**
 * Parse the data of appinfo.vdf.
 * @function
 * @param {string|Buffer} data - The file data to parse.
 * @returns {Array} - An array of appinfo entries as anonymous Objects.
 * @throws {Error} - If there is an error parsing the data.
 */
async function parseAppInfo (data) {
  let buffer
  let len
  let first = true

  try {
    len = data.length
    buffer = ByteBuffer.wrap(data, 'hex', true).resize(len)
    data = []
    let done = false

    do {
      try {
        let aid = buffer.readUint32().toString(10) // eslint-disable-line no-unused-vars
        /*
          if (aid === 0x00000000) {
            return data
          }
         */

        let skip = (first ? 49 : 48)
        let skipped = []
        first = false
        do {
          skipped.push(buffer.readUint8())
        } while ((skip -= 1) !== 0)
        /* @ignore
          let size = buffer.readUint32() // eslint-disable-line no-unused-vars
          let state = buffer.readUint32() // eslint-disable-line no-unused-vars
          let updated = new Date(buffer.readUint32() * 1000).toString()
          let accessToken = buffer.readUint64() // eslint-disable-line no-unused-vars
          let sha1 = []
          do {
            sha1.push(buffer.readUint8())
          } while (sha1.length < 20)

          ({
            appid: aid,
            sizeOf: size,
            infoState: state,
            lastUpdated: updated,
            token: accessToken,
            hash: sha1,
            change: changeNumber
          })
        */

        let info
        info = await decode(buffer)
        /*
          if (info.config && info.config.steamcontrollertemplateindex && info.config.steamcontrollertemplateindex < 0) {
            /* @ignore
             * Based on https://stackoverflow.com/a/28519774/7665043
             * Fixes some signed int values that are too big for JS being stored as unsigned int (negative) values.
            info.config.steamcontrollertemplateindex += (1 << 30) * 4
          }
         */
        data.push({
          'id': info.appid,
          'name': 'appinfo',
          'entries': info
        })
      } catch (err) {
        /* istanbul ignore next */
        if ((err.message.indexOf('Index out of range') !== -1 || err.message.indexOf('Illegal offset') !== -1) && err.message.indexOf(len) !== -1) {
          // Ignore; parser doesn't handle EOF, so this is how it's handled.
          done = true
          break
        } else {
          // It's a real error otherwise.
          /* istanbul ignore next */
          throw err
        }
      }
    } while (!done)
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }

  return data
}

/**
 * Parse the data of packageinfo.vdf.
 * @function
 * @param {string|Buffer} data - The file data to parse.
 * @returns {Array} - An array of packageinfo entries as anonymous Objects.
 * @throws {Error} - If there is an error parsing the data.
  function parsePackageInfo (data) {
  let buffer
  let len

  try {
    len = data.length
    buffer = ByteBuffer.wrap(data, 'hex', true).resize(len)
    data = []

    while (true) {
      try {
        // package id
        let pid = buffer.readCString().toString() // eslint-disable-line no-unused-vars
        let hash = [ // eslint-disable-line no-unused-vars
          buffer.readUint32(),
          buffer.readUint32(),
          buffer.readUint32(),
          buffer.readUint32(),
          buffer.readUint32()
        ].toString(16)
        let tmp = decode(buffer)
        data.push(tmp)
      } catch (err) {
        if (err.message.indexOf('Index out of range') !== -1 && err.message.indexOf(len) !== -1) {
          break
        } else {
          throw new Error(err)
        }
      }
    }
  } catch (err) {
    throw new Error(err)
  }

  return data
}
 */
/**
 * Parse the data of shortcuts.vdf. Auto-converts some data to timestamps/arrays/etc.
 * @function
 * @param {string|Buffer} data - The file data to parse.
 * @returns {Array} - An array of shortcut entries as anonymous Objects.
 * @throws {Error} - If there is an error parsing the data.
 */

async function parseShortcuts (data) {
  let autoConvert = {
    booleans: [
      'IsHidden', 'AllowDesktopConfig', 'AllowOverlay', 'OpenVR'
    ],
    timestamps: [
      'LastPlayTime'
    ],
    arrays: [
      'tags'
    ]
  }

  try {
    data = await decode(ByteBuffer.wrap(data, 'hex', true).resize(data.length))
    data = convertData(Object.values(data.shortcuts), autoConvert)

    return {shortcuts: data}
    // return decode(ByteBuffer.wrap(data, 'hex', true).resize(data.length)), autoConvert)
  } catch (err) {
    /* istanbul ignore next */
    throw err
  }
}

/**
 * @typedef {Object} DataConversion
 * @property {Array} booleans - The names of some boolean values to convert.
 * @property {Array} timestamps - The names of some timestamp values to convert.
 * @property {Array} arrays - The names of some arrays to convert.
 */

exports.parseAppInfo = parseAppInfo
exports.parseShortcuts = parseShortcuts
exports.decode = decode
