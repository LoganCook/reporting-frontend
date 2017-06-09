'use strict'
define(['../../js/services/rollerUpperer', '../console-switcher'], function(objectUnderTest, cs) {
  describe('Roller Upperer', function() {

    describe('builder', function () {
      it('should be able to build an instance', function () {
        var result = objectUnderTest
          .builder()
          .fieldsToSum(['cost'])
          .fieldsToIgnore(['rubbish'])
          .joinFields(['theKey'])
          .build()
        expect(result).toBeDefined()
        expect(typeof result.doRollup).toBe('function')
      })

      it('should throw an error when fieldsToSum is not an array', function () {
        expect(function () {
          objectUnderTest.builder().fieldsToSum('cost')
        }).toThrow()
      })

      it('should throw an error when fieldsToIgnore is not an array', function () {
        expect(function () {
          objectUnderTest.builder().fieldsToIgnore('source')
        }).toThrow()
      })

      it('should throw an error when joinFields is not an array', function () {
        expect(function () {
          objectUnderTest.builder().joinFields('username')
        }).toThrow()
      })
    })

    describe('doRollup', function () {
      it('should be able to rollup a simple case', function() {
        var rows = [
          {
              cost: 111,
              username: 'testuser',
              source: 'system1'
          },
          {
              cost: 222,
              username: 'testuser',
              source: 'system2'
          }
        ]
        var instance = objectUnderTest
            .builder()
            .fieldsToSum(['cost'])
            .fieldsToIgnore(['source'])
            .joinFields(['username'])
            .build()
        var result = instance.doRollup(rows)
        expect(result.isAllSuccess).toBeTruthy()
        expect(result.errors.length).toBe(0)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(1)
        expect(rollupResult[0].source).toBeUndefined()
        expect(rollupResult[0].username).toBe('testuser')
        expect(rollupResult[0].cost).toBe(111 + 222)
      })

      it('should be able to rollup with multiple final rows', function() {
        var rows = [
          {
              cost: 111,
              username: 'testuser',
              source: 'system1'
          },
          {
              cost: 222,
              username: 'user2',
              source: 'system1'
          },
          {
              cost: 333,
              username: 'testuser',
              source: 'system2'
          },
          {
              cost: 444,
              username: 'user3',
              source: 'system2'
          }
        ]
        var instance = objectUnderTest
            .builder()
            .fieldsToSum(['cost'])
            .fieldsToIgnore(['source'])
            .joinFields(['username'])
            .build()
        var result = instance.doRollup(rows)
        expect(result.isAllSuccess).toBeTruthy()
        expect(result.errors.length).toBe(0)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(3)
        var firstElement = rollupResult[0]
        expect(firstElement.source).toBeUndefined()
        expect(firstElement.username).toBe('testuser')
        expect(firstElement.cost).toBe(111 + 333)
        expect(rollupResult[1].username).toBe('user2')
        expect(rollupResult[2].username).toBe('user3')
      })

      it('should be able to catch when a non-ignored field does not match', function() {
        var rows = [
          {
              cost: 111,
              username: 'testuser',
              source: 'system1',
              notIgnored: 'foo'
          },
          {
              cost: 222,
              username: 'testuser',
              source: 'system2',
              notIgnored: 'bar'
          }
        ]
        var instance = objectUnderTest
            .builder()
            .fieldsToSum(['cost'])
            .fieldsToIgnore(['source'])
            .joinFields(['username'])
            .build()
        cs.consoleOff()
        var result = instance.doRollup(rows)
        cs.consoleOn()
        expect(result.isAllSuccess).toBeFalsy()
        expect(result.errors.length).toBe(1)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(1)
      })

      it('should be able to rollup with a composite key', function() {
        var rows = [
          {
              cost: 111,
              username: 'testuser',
              filesystem: '/fs1'
          },
          {
              cost: 222,
              username: 'testuser',
              filesystem: '/fs2'
          },
          {
              cost: 333,
              username: 'testuser',
              filesystem: '/fs1'
          },
          {
              cost: 444,
              username: 'testuser',
              filesystem: '/fs2'
          }
        ]
        var instance = objectUnderTest
            .builder()
            .fieldsToSum(['cost'])
            .fieldsToIgnore([])
            .joinFields(['username', 'filesystem'])
            .build()
        var result = instance.doRollup(rows)
        expect(result.isAllSuccess).toBeTruthy()
        expect(result.errors.length).toBe(0)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(2)
        var firstElement = rollupResult[0]
        expect(firstElement.username).toBe('testuser')
        expect(firstElement.filesystem).toBe('/fs1')
        expect(firstElement.cost).toBe(111 + 333)
        var secondElement = rollupResult[1]
        expect(secondElement.username).toBe('testuser')
        expect(secondElement.filesystem).toBe('/fs2')
        expect(secondElement.cost).toBe(222 + 444)
      })

      it('should be able to catch when no join fields are supplied', function() {
        var rows = [
          {
              cost: 111,
              username: 'testuser',
              filesystem: '/fs1'
          },
          {
              cost: 222,
              username: 'testuser',
              filesystem: '/fs2'
          }
        ]
        var noJoinFields = []
        var instance = objectUnderTest
            .builder()
            .fieldsToSum(['cost'])
            .fieldsToIgnore([])
            .joinFields(noJoinFields)
            .build()
        cs.consoleOff()
        var result = instance.doRollup(rows)
        cs.consoleOn()
        expect(result.isAllSuccess).toBeFalsy()
        expect(result.errors.length).toBe(2)
        var rollupResult = result.rollupResult
      })
    })

    describe('.assertEqual', function() {
      it('should assert that equal strings are in fact equal', function() {
        objectUnderTest._test_only.assertEqual('field1', {field1: 'foo'}, {field1: 'foo'})
        // expect nothing to be thrown
      })

      it('should assert that unequal strings are not equal', function() {
        expect(function () {
          objectUnderTest._test_only.assertEqual('field1', {field1: 'foo'}, {field1: 'bar'})
        }).toThrow()
      })

      it('should assert that equal integers are in fact equal', function() {
        objectUnderTest._test_only.assertEqual('field1', {field1: 1337}, {field1: 1337})
        // expect nothing to be thrown
      })

      it('should assert that unequal integers are not equal', function() {
        expect(function () {
          objectUnderTest._test_only.assertEqual('field1', {field1: 666}, {field1: 667})
        }).toThrow()
      })

      it('should always pass when the first value is undefined', function() {
        objectUnderTest._test_only.assertEqual('field1', {/*don't defined field1*/}, {field1: 'foo'})
        // expect nothing to be thrown
      })

      it('should always pass when the second value is undefined', function() {
        objectUnderTest._test_only.assertEqual('field1', {field1: 'foo'}, {/*don't defined field1*/})
        // expect nothing to be thrown
      })
    })

    describe('.doSum', function() {
      it('should sum two integers', function() {
        var result = objectUnderTest._test_only.doSum(11, 22)
        expect(result).toBe(33)
      })

      it('should handle the second param as null', function() {
        var result = objectUnderTest._test_only.doSum(null, 22)
        expect(result).toBe(22)
      })

      it('should handle the second param as null', function() {
        var result = objectUnderTest._test_only.doSum(11, null)
        expect(result).toBe(11)
      })
    })

    describe('.createKey', function() {
      it('should create a key when all fields are found', function() {
        var result = objectUnderTest._test_only.createKey(
          ['f1', 'f2'],
          {f1: 'foo', f2: 'bar'})
        expect(result).toBe('foobar')
      })

      it('should throw an error when no key is generated', function() {
        expect(function () {
          objectUnderTest._test_only.createKey(
            [],
            {f1: 'foo', f2: 'bar'})
        }).toThrow()
      })

      it('should throw an error when any of the fields are not found', function() {
        expect(function () {
          var fieldThatDoesntExist = 'f2'
          objectUnderTest._test_only.createKey(
            ['f1', fieldThatDoesntExist],
            {f1: 'foo'})
        }).toThrow()
      })
    })
  })

  
})
