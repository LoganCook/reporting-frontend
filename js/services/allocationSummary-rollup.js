define(['./rollerUpperer', 'lodash'], function(rollerUpperer, _) {
  'use strict'

  var allocationSummaryRollerUpperer = rollerUpperer
    .builder()
    .fieldsToSum([
      'approved_size',
      'blocks',
      'cost',
      'usage'
    ])
    .fieldsToIgnore([
      'bytes_in',
      'bytes_out',
      'deletes',
      'ingested_bytes',
      'metadata_only_bytes',
      'metadata_only_objects',
      'namespace',
      'objects',
      'raw',
      'raw_bytes',
      'reads',
      'source',
      'tiered_bytes',
      'tiered_objects',
      'writes'
    ])
    .joinFields([
      'orderID',
      'filesystem'
    ])
    .build()

  return {
    createUserRollup: function (rows) {
      return allocationSummaryRollerUpperer.doRollup(rows)
    }
  }
})
