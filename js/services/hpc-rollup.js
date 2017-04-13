define(['./rollerUpperer', 'lodash'], function(rollerUpperer, _) {
  'use strict'

  var hpcRollerUpperer = rollerUpperer
    .builder()
    .fieldsToSum([
      'cores',
      'cost',
      'cpu_seconds',
      'hours',
      'job_count'
    ])
    .fieldsToIgnore([
      'queue'
    ])
    .joinFields([
      'username'
    ])
    .build()

  return {
    createUserRollup: function (rows) {
      return hpcRollerUpperer.doRollup(rows)
    }
  }
})
