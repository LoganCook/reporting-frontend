'use strict'
define(['../../js/services/allocationSummary-rollup'], function(objectUnderTest) {
  describe('Allocation summary rollup', function() {

    it('should be able to rollup when all fields are present', function() {
      var detailRows = [
        {
            "FileSystemName":"some-test-filesystem-104",
            "allocated":2000,
            "allocated@OData.Community.Display.V1.FormattedValue":"2000",
            "approved_size":2000,
            "biller":"University of Test",
            "billing":"University of Test",
            "blocks":1,
            "contractor":"Test User",
            "cost":5,
            "files":1305,
            "filesystem":"some-test-filesystem-104",
            "full_name":"Test User",
            "manager":"Test User",
            "managercontactid":"aaa80a11-b362-e611-80e3-c4346bc43f98",
            "managercontactid@OData.Community.Display.V1.FormattedValue":"Test User",
            "manageremail":"test.user@test.com",
            "managertitle":"Research Officer",
            "managerunit":"School of Test",
            "name":"Data from some test study",
            "orderID":"UOFA0104",
            "owner":"",
            "quota":2048000,
            "raw":8840,
            "salesorderdetail2_x002e_transactioncurrencyid":"744fd97c-18fb-e511-80d8-c4346bc5b718",
            "salesorderdetail2_x002e_transactioncurrencyid@OData.Community.Display.V1.FormattedValue":"Australian Dollar",
            "salesorderid":"90bbbe62-b3fc-e611-8114-70106fa3d971",
            "source":"HNAS VV",
            "unitPrice":5,
            "unitPrice@OData.Community.Display.V1.FormattedValue":"$5.00",
            "usage":8.84,
            "virtual_volume":"some-test-filesystem-104"
        },
        {
            "FileSystemName":"some-test-filesystem-104",
            "allocated":2000,
            "allocated@OData.Community.Display.V1.FormattedValue":"2000",
            "approved_size":2000,
            "biller":"University of Test",
            "billing":"University of Test",
            "blocks":1,
            "bytes_in":0,
            "bytes_out":213696,
            "contractor":"Test User",
            "cost":5,
            "deletes":0,
            "filesystem":"some-test-filesystem-104",
            "full_name":"Test User",
            "ingested_bytes":9242264754,
            "manager":"Test User",
            "managercontactid":"aaa80a11-b362-e611-80e3-c4346bc43f98",
            "managercontactid@OData.Community.Display.V1.FormattedValue":"Test User",
            "manageremail":"test.user@test.com",
            "managertitle":"Research Officer",
            "managerunit":"School of Test",
            "metadata_only_bytes":0,
            "metadata_only_objects":0,
            "name":"Data from some test study",
            "namespace":"some-test-filesystem-104",
            "objects":1157,
            "orderID":"UOFA0104",
            "raw":18497921024,
            "raw_bytes":18497921024,
            "reads":252,
            "salesorderdetail2_x002e_transactioncurrencyid":"744fd97c-18fb-e511-80d8-c4346bc5b718",
            "salesorderdetail2_x002e_transactioncurrencyid@OData.Community.Display.V1.FormattedValue":"Australian Dollar",
            "salesorderid":"90bbbe62-b3fc-e611-8114-70106fa3d971",
            "source":"HCP",
            "tiered_bytes":0,
            "tiered_objects":0,
            "unitPrice":5,
            "unitPrice@OData.Community.Display.V1.FormattedValue":"$5.00",
            "usage":17.22753143310547,
            "writes":0
        }
      ]
      var result = objectUnderTest.createUserRollup(detailRows)
      expect(result.length).toBe(1)
      expect(result[0].approved_size).toBe(2000 + 2000)
      expect(result[0].usage).toBe(8.84 + 17.22753143310547)
      expect(result[0].blocks).toBe(1 + 1)
      expect(result[0].cost).toBe(5 + 5)
    })
  })
})
