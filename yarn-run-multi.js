/*
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 *
 * Downloads a shallow clone (ZIP copy) of the latest version of
 * github.com/braintree/jsdoc-template and extracts it to ./jsdoc-braintree
 *
 */

'use strict'

const cli = require('cli')
const shell = require('shelljs')

const options = cli.parse({
  args: ['a', 'The arguments for the script', 'string'],
  script: ['s', 'The script to run', 'path'],
  times: ['t', 'The number of times to run it', 'number', 2]
})
try {
  console.info(options.args)

  if (!shell.which('yarn')) {
    shell.exit(1)
    throw new Error('shelljs could not find yarn.')
  }

  do {
    if (shell.exec(`${options.script} ${options.args}`).code !== 0) {
      shell.exit(1)
      throw new Error(`Error while running ${options.script} with args ${options.args}.`)
    }
  } while ((options.times -= 1) !== 0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
