define(['lodash'], function(_) {
  'use strict'

  /**
   * Iterates over the supplied rows and rolls up (sums) the specified fields. The join
   * is done by building a (composite)key using the supplied field name(s) and as we process
   * each row, we check that all the non-key, non-summed and non-ignored fields are equal
   * so we don't lose any information.
   * @param {object[]} detailRows rows to perform rollup on
   * @param {string[]} fieldsToSum names of fields that will be rolled(summed) up
   * @param {string[]} fieldsToIgnore names of fields that we won't check for equality
   * @param {string[]} joinFields names of fields that we'll create a (composite)key to perform the join
   * @returns {object[]} rolled up rows. One row per key with the fieldsToSum as the totals
   */
  function createUserRollup (detailRows, fieldsToSum, fieldsToIgnore, joinFields) {
    var isAllSuccess = true
    var errorCount = 0
    var groupedAndSummed = _.reduce(detailRows, function (res, currRow) {
      try {
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
      } catch (e) {
        console.error('Data error: failed while rolling up a row', e)
        isAllSuccess = false
        errorCount++
      } finally {
        return res
      }
    }, {})
    return {
      rollupResult: _.values(groupedAndSummed),
      isAllSuccess: isAllSuccess,
      errorCount: errorCount
    }
  }

  function createKey (fieldNames, obj) {
    var result = ''
    fieldNames.forEach(function (curr) {
      if (!obj[curr]) {
        throw new Error('Data problem: could not find required field "' + curr + '"'
          + ' on object "' + JSON.stringify(obj) + '" in order to create a key')
      }
      result += obj[curr]
    })
    if (result === '') {
      throw new Error('No join key was produced using the fields "'
        + JSON.stringify(fieldNames) + '" and the object "'
        + JSON.stringify(obj) + '". Refusing to continue.')
    }
    return result
  }

  function assertEqual (fieldName, val1, val2) {
    if (typeof val1[fieldName] === 'undefined' ||
        typeof val2[fieldName] === 'undefined') {
      return
    }
    if (val1[fieldName] === val2[fieldName]) {
      return
    }
    throw new Error('Data problem: expected field "' + fieldName + '" values to be equal but were "'
        + val1[fieldName] + '" and "' + val2[fieldName] + '"')
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
        throw new Error('"fields" parameter must be an array')
      }
      _fieldsToSum = fields
      return self
    }

    self.fieldsToIgnore = function (fields) {
      if (!_.isArray(fields)) {
        throw new Error('"fields" parameter must be an array')
      }
      _fieldsToIgnore = fields
      return self
    }

    self.joinFields = function (fields) {
      if (!_.isArray(fields)) {
        throw new Error('"fields" parameter must be an array')
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
        doSum: doSum,
        createKey: createKey
      }
  }
})
