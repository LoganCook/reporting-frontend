define(['./rollerUpperer'], function(rollerUpperer) {
  'use strict';
/* Roller up instance for slurm */
  var SlurmRollerUpper = rollerUpperer
    .builder()
    .fieldsToSum([
      'totalFee',
      'totalCPUHours',
      'totalCount'
    ])
    .fieldsToIgnore([
      'orderline_id',
      'price',
      'name',
      'identifier',
      'partition'
    ])
    .joinFields([
      'user'
    ])
    .build();

  return {
    createUserRollup: function (rows) {
      return SlurmRollerUpper.doRollup(rows);
    }
  };
});
