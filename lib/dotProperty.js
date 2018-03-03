'use strict'

function set (obj, path, val) {
  let prop = '' + path

  path = path.split('.')

  if (obj.hasOwnProperty(prop)) {
    obj[ prop ] = val
  } else if (path.length !== 0 && obj.hasOwnProperty(path[ 0 ])) {
    obj[path[ 0 ]] = set(obj[path[ 0 ]], path.slice(1).join('.'), val)
  }

  return obj
}

function get (obj, path) {
  let prop = '' + path

  path = path.split('.')

  if (obj.hasOwnProperty(prop)) {
    return obj[ prop ]
  } else if (path.length !== 0 && obj.hasOwnProperty(path[ 0 ])) {
    return get(obj[path[ 0 ]], path.slice(1).join('.'))
  }

  return null
}

module.exports = {
  set,
  get
}
