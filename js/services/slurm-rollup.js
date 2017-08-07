define(['./rollerUpperer'], function(rollerUpperer) {
  'use strict';
/* Roller up instance for slurm */
  var SlurmRollerUpper = rollerUpperer
    .builder()
    .fieldsToSum([
      'cost',
      'cpu_seconds',
      'hours',
      'job_count'
    ])
    .fieldsToIgnore([
      'partition'
    ])
    .joinFields([
      'owner'
    ])
    .build();

  return {
    createUserRollup: function (rows) {
      return SlurmRollerUpper.doRollup(rows);
    }
  };
});
