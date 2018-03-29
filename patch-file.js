'use strict'

function patch (data, at, inject) {
  console.info('Injecting "' + inject + '"\nAt "' + at + '"')

  const start = data.indexOf(at)

  if (start !== -1) {
    data = [data.slice(0, start), inject, data.slice(start)].join('')
  }

  return data
}

function isScript () {
  return require.main && require.main.filename === /\((.*):\d+:\d+\)$/.exec((new Error()).stack.split('\n')[ 2 ])[ 1 ]
}

if (!isScript) {
  const cli = require('cli')
  const opts = cli.parse({
    file: ['f', 'The file to patch', 'path'],
    injecting: ['i', 'The data to inject', 'string'],
    at: ['a', 'The string to start injection at', 'string']
  })
  const fs = require('fs')

  try {
    let data = fs.readFileSync(opts.file)
    data = patch('' + data, opts.injecting, opts.at)
    fs.writeFileSync(opts.file, data)
  } catch (err) {
    throw err
  }
} else {
  module.exports = {
    patch
  }
}
