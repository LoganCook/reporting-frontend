'use strict'
define(['../../js/services/rollerUpperer'], function(objectUnderTest) {
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
        try {
          objectUnderTest.builder().fieldsToSum('cost')
          fail('Error should have been thrown due to not supplying an array')
        } catch (error) {
          // success
        }
      })

      it('should throw an error when fieldsToIgnore is not an array', function () {
        try {
          objectUnderTest.builder().fieldsToIgnore('source')
          fail('Error should have been thrown due to not supplying an array')
        } catch (error) {
          // success
        }
      })

      it('should throw an error when joinFields is not an array', function () {
        try {
          objectUnderTest.builder().joinFields('username')
          fail('Error should have been thrown due to not supplying an array')
        } catch (error) {
          // success
        }
      })
    })

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
      expect(result.length).toBe(1)
      expect(result[0].source).toBeUndefined()
      expect(result[0].username).toBe('testuser')
      expect(result[0].cost).toBe(111 + 222)
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
      expect(result.length).toBe(3)
      var firstElement = result[0]
      expect(firstElement.source).toBeUndefined()
      expect(firstElement.username).toBe('testuser')
      expect(firstElement.cost).toBe(111 + 333)
      expect(result[1].username).toBe('user2')
      expect(result[2].username).toBe('user3')
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
      try {
        instance.doRollup(rows)
        fail('should have caught the "notIgnored" field being different')
      } catch (error) {
        // success
      }
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
      expect(result.length).toBe(2)
      var firstElement = result[0]
      expect(firstElement.username).toBe('testuser')
      expect(firstElement.filesystem).toBe('/fs1')
      expect(firstElement.cost).toBe(111 + 333)
      var secondElement = result[1]
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
      try {
        instance.doRollup(rows)
        fail('should have caught that there were no join fields')
      } catch (error) {
        // success
      }
    })

    describe('.assertEqual', function() {
      it('should assert that equal strings are in fact equal', function() {
        objectUnderTest._test_only.assertEqual('field1', {field1: 'foo'}, {field1: 'foo'})
        // expect nothing to be thrown
      })

      it('should assert that unequal strings are not equal', function() {
        try {
          objectUnderTest._test_only.assertEqual('field1', {field1: 'foo'}, {field1: 'bar'})
          fail('Expected error to be thrown')
        } catch (error) {
          // success
        }
      })

      it('should assert that equal integers are in fact equal', function() {
        objectUnderTest._test_only.assertEqual('field1', {field1: 1337}, {field1: 1337})
        // expect nothing to be thrown
      })

      it('should assert that unequal integers are not equal', function() {
        try {
          objectUnderTest._test_only.assertEqual('field1', {field1: 666}, {field1: 667})
          fail('Expected error to be thrown')
        } catch (error) {
          // success
        }
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
  })
})
