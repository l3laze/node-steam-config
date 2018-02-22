'use strict'

function set (obj, path, val) {
  let prop = Object.assign(path)

  path = path.split('.')

  if (path[ 0 ] === '') {
    path.length = 0
  }

  if (obj.hasOwnProperty(prop)) {
    obj[ prop ] = val
  } else if (path.length !== 0 && obj.hasOwnProperty(path[ 0 ])) {
    obj[path[ 0 ]] = set(obj[path[ 0 ]], path.slice(1).join('.'), val)
  }

  return obj
}

function get (obj, path) {
  let prop = Object.assign(path)

  path = path.split('.')

  if (path[ 0 ] === '') {
    path.length = 0
  }

  if (obj.hasOwnProperty(prop)) {
    return obj[ prop ]
  } else if (path.length !== 0 && obj.hasOwnProperty(path[ 0 ])) {
    return get(obj[path[ 0 ]], path.slice(1).join('.'))
  }

  return undefined
}

module.exports = {
  set,
  get
}
