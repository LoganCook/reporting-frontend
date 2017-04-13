define(['lodash'], function(_) {
  'use strict'

  function createUserRollup (detailRows, fieldsToSum, fieldsToIgnore, joinFields) {
    var groupedAndSummed = _.reduce(detailRows, function (res, currRow) {
      var joinFieldValue = createKey(joinFields, currRow)
      if (!res[joinFieldValue]) {
        var copy = angular.copy(currRow)
        fieldsToIgnore.forEach(function (curr) {
          delete copy[curr]
        })
        res[joinFieldValue] = copy
        return res
      }
      var existing = res[joinFieldValue]
      fieldsToSum.forEach(function (currField) {
        // TODO add configuration to allow supplying a multiplier for the values
        existing[currField] = doSum(existing[currField], currRow[currField])
      })
      var fieldsToNotAssertEquality = _.union(fieldsToSum, fieldsToIgnore)
      var fieldsToAssertEquality = _.difference(Object.keys(currRow), fieldsToNotAssertEquality)
      fieldsToAssertEquality.forEach(function (currField) {
        assertEqual(currField, existing, currRow)
      })
      res[joinFieldValue] = existing
      return res
    }, {})
    return _.values(groupedAndSummed)
  }

  function createKey (fieldNames, obj) {
    var result = ''
    fieldNames.forEach(function (curr) {
      result += obj[curr]
    })
    if (result === '') {
      throw 'No join key was produced using the fields "'
        + JSON.stringify(fieldNames) + '" and the object "'
        + JSON.stringify(obj) + '". Refusing to continue.'
    }
    return result
  }

  function assertEqual (fieldName, val1, val2) {
    if (val1[fieldName] === val2[fieldName]) {
      return
    }
    throw 'Data problem: expected field "' + fieldName + '" values to be equal but were "'
        + val1[fieldName] + '" and "' + val2[fieldName] + '"'
  }

  function doSum (val1, val2) {
    return (val1 || 0) + (val2 || 0)
  }

  function Builder() {
    var self = this
    var _fieldsToSum
    var _fieldsToIgnore
    var _joinFields

    self.fieldsToSum = function (fields) {
      if (!_.isArray(fields)) {
        throw '"fields" parameter must be an array'
      }
      _fieldsToSum = fields
      return self
    }

    self.fieldsToIgnore = function (fields) {
      if (!_.isArray(fields)) {
        throw '"fields" parameter must be an array'
      }
      _fieldsToIgnore = fields
      return self
    }

    self.joinFields = function (fields) {
      if (!_.isArray(fields)) {
        throw '"fields" parameter must be an array'
      }
      _joinFields = fields
      return self
    }

    self.build = function () {
      return {
        doRollup: function (rows) {
          return createUserRollup(rows, _fieldsToSum, _fieldsToIgnore, _joinFields)
        }
      }
    }
  }

  return {
      builder: function () {
        return new Builder()
      },
      _test_only: {
        assertEqual: assertEqual,
        doSum: doSum
      }
  }
})
