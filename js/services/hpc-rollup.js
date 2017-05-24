define(['./rollerUpperer'], function(rollerUpperer) {
  'use strict';

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
      'owner'
    ])
    .build()

  return {
    createUserRollup: function (rows) {
      return hpcRollerUpperer.doRollup(rows);
    }
  }
})
