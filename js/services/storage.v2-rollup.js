define(['./rollerUpperer', 'lodash'], function(rollerUpperer, _) {
  'use strict'

  var allocationSummaryRollerUpperer = rollerUpperer
    .builder()
    .fieldsToSum([
      'totalFee',
      'avgUsage'
    ])
    .fieldsToIgnore([
      'price',
      'name',
    ])
    .joinFields([
      'orderline_id',
      'identifier'
    ])
    .build()

  return {
    createUserRollup: function (rows) {
      return allocationSummaryRollerUpperer.doRollup(rows)
    }
  }
})
