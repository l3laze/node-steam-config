/* eslint-env mocha */
'use strict'

const dotProperty = require('../dotProperty.js')

const should = require('chai').should()

let testData

describe('dotProperty', function () {
  beforeEach(function () {
    testData = {
      'Something': {
        'Something': {
          'Darkside': {
            'isMagic': true
          },
          'SomethingElse': {
            'SomeSong': 'I forgot the words to'
          }
        },
        'Is.Wrong.With.The.Space.Bar': true
      }
    }
  })

  afterEach(function () {
    testData = undefined
  })

  describe('#get(obj, path)', function () {
    it('should get a property value from an object based on a valid path', function getValid () {
      let val = dotProperty.get(testData, 'Something.Something.Darkside.isMagic')
      val.should.equal(true)
    })

    it('should be able to handle properties with a dot in them too', function getValidDotProp () {
      let val = dotProperty.get(testData, 'Something.Is.Wrong.With.The.Space.Bar')
      val.should.equal(true)
    })

    it('should return undefined for an invalid path or prop argument', function getInvalid () {
      let val = dotProperty.get(testData, 'Something.Something.DarkSide.isMagic')
      should.equal(val, undefined)
    })
  })

  describe('#set(obj, path)', function () {
    it('should set a property value from an object based on a valid path', function setValid () {
      testData = dotProperty.set(testData, 'Something.Something.Darkside.isMagic', false)
      testData.Something.Something.Darkside.isMagic.should.equal(false)
    })

    it('should be able to handle properties with a dot in them too', function setValidDotProp () {
      testData = dotProperty.set(testData, 'Something.Is.Wrong.With.The.Space.Bar', false)
      testData.Something[ 'Is.Wrong.With.The.Space.Bar' ].should.equal(false)
    })

    it('should do nothing for an invalid path or prop argument', function setInvalid () {
      let orig = Object.assign(testData)
      testData = dotProperty.set(testData, 'Something.Something.DarkSide.isMagic', 'You let them do what to my multi-billion dollar space ship?!')
      JSON.stringify(testData).should.equal(JSON.stringify(orig))
    })
  })
})
