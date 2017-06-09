'use strict'
define(['../../js/services/hpc-rollup', '../console-switcher'], function(objectUnderTest, cs) {
  describe('HPC rollup', function() {
    describe('createUserRollup', function () {
      it('should sum up the grouped fields when there are more than one record for a user', function() {
        var detailRows = [
          {
            "cores": 32,
            "cpu_seconds": 1094638,
            "job_count": 32,
            "owner": "tuser",
            "queue": "tizard",
            "contactid": "02be71c5-vvvv-e611-80e3-c4346bc43f98",
            "username": "tuser",
            "email": "test.user@test.com",
            "unit": "Test Sciences",
            "manager": "Test User",
            "billing": "Test University",
            "fullname": "Test User",
            "organisation": "Test Sciences",
            "hours": 304.06611111111,
            "cost": 181.07456563574
          },
          {
            "cores": 384,
            "cpu_seconds": 19007392,
            "job_count": 12,
            "owner": "tuser",
            "queue": "bigmem",
            "contactid": "02be71c5-vvvv-e611-80e3-c4346bc43f98",
            "username": "tuser",
            "email": "test.user@test.com",
            "unit": "Test Sciences",
            "manager": "Test User",
            "billing": "Test University",
            "fullname": "Test User",
            "organisation": "Test Sciences",
            "hours": 5279.8311111111,
            "cost": 3144.1949304411
          },
          {
            "cores": 3,
            "cpu_seconds": 73818,
            "job_count": 3,
            "owner": "tuser",
            "queue": "short",
            "contactid": "02be71c5-vvvv-e611-80e3-c4346bc43f98",
            "username": "tuser",
            "email": "test.user@test.com",
            "unit": "Test Sciences",
            "manager": "Test User",
            "billing": "Test University",
            "fullname": "Test User",
            "organisation": "Test Sciences",
            "hours": 20.505,
            "cost": 12.210943057064
          }
        ]
        var result = objectUnderTest.createUserRollup(detailRows)
        expect(result.isAllSuccess).toBeTruthy()
        expect(result.errors.length).toBe(0)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(1)
        expect(rollupResult[0].billing).toBe('Test University')
        expect(rollupResult[0].organisation).toBe('Test Sciences')
        expect(rollupResult[0].username).toBe('tuser')
        expect(rollupResult[0].fullname).toBe('Test User')
        expect(rollupResult[0].email).toBe('test.user@test.com')
        expect(rollupResult[0].job_count).toBe(32 + 12 + 3)
        expect(rollupResult[0].hours).toBe(304.06611111111 + 5279.8311111111 + 20.505)
        expect(rollupResult[0].cost).toBe(181.07456563574 + 3144.1949304411 + 12.210943057064)
        expect(rollupResult[0].cores).toBe(32 + 384 + 3)
        expect(rollupResult[0].cpu_seconds).toBe(1094638 + 19007392 + 73818)
      })

      it('should consider no cost field to mean cost = 0', function() {
        var detailRows = [
          {
            "cores": 32,
            "cpu_seconds": 1094638,
            "job_count": 32,
            "owner": "tuser",
            "queue": "tizard",
            "contactid": "02be71c5-vvvv-e611-80e3-c4346bc43f98",
            "username": "tuser",
            "email": "test.user@test.com",
            "unit": "Test Sciences",
            "manager": "Test User",
            "billing": "Test University",
            "fullname": "Test User",
            "organisation": "Test Sciences",
            "hours": 304.06611111111
            // no 'cost' field
          },
          {
            "cores": 384,
            "cpu_seconds": 19007392,
            "job_count": 12,
            "owner": "tuser",
            "queue": "bigmem",
            "contactid": "02be71c5-vvvv-e611-80e3-c4346bc43f98",
            "username": "tuser",
            "email": "test.user@test.com",
            "unit": "Test Sciences",
            "manager": "Test User",
            "billing": "Test University",
            "fullname": "Test User",
            "organisation": "Test Sciences",
            "hours": 5279.8311111111
            // no 'cost' field
          }
        ]
        var result = objectUnderTest.createUserRollup(detailRows)
        expect(result.isAllSuccess).toBeTruthy()
        expect(result.errors.length).toBe(0)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(1)
        expect(rollupResult[0].billing).toBe('Test University')
        expect(rollupResult[0].organisation).toBe('Test Sciences')
        expect(rollupResult[0].username).toBe('tuser')
        expect(rollupResult[0].fullname).toBe('Test User')
        expect(rollupResult[0].email).toBe('test.user@test.com')
        expect(rollupResult[0].job_count).toBe(32 + 12)
        expect(rollupResult[0].hours).toBe(304.06611111111 + 5279.8311111111)
        expect(rollupResult[0].cost).toBe(0)
        expect(rollupResult[0].cores).toBe(32 + 384)
        expect(rollupResult[0].cpu_seconds).toBe(1094638 + 19007392)
      })

      it('should skip the row when a non-summed field does not match', function() {
        var cutDownRows = [
          {
            "owner": "tuser",
            "cores": 32,
            "cpu_seconds": 1094638,
            "job_count": 32,
            "queue": "tizard",
            "username": "tuser",
            "organisation": "Test Sciences",
            "hours": 304.06611111111,
            "cost": 0
          },
          {
            "owner": "tuser",
            "cores": 384,
            "cpu_seconds": 19007392,
            "job_count": 12,
            "queue": "bigmem",
            "username": "tuser",
            "organisation": "School of Test", // different from above
            "hours": 5279.8311111111,
            "cost": 0
          }
        ]
        cs.consoleOff()
        var result = objectUnderTest.createUserRollup(cutDownRows)
        cs.consoleOn()
        expect(result.isAllSuccess).toBeFalsy()
        expect(result.errors.length).toBe(1)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(1)
      })

      it('should survive an empty input array', function() {
        var emptyArray = []
        var result = objectUnderTest.createUserRollup(emptyArray)
        expect(result.isAllSuccess).toBeTruthy()
        expect(result.errors.length).toBe(0)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(0)
      })

      it('should be able to rollup when we have records for more than one user', function() {
        var detailRows = [
          {
            "cores": 32,
            "cpu_seconds": 1094638,
            "job_count": 32,
            "owner": "tuser",
            "queue": "tizard",
            "contactid": "bbbe71c5-vvvv-e611-80e3-c4346bc43f98",
            "username": "tuser",
            "email": "test.user@test.com",
            "unit": "Test Sciences",
            "manager": "Test User",
            "billing": "Test University",
            "fullname": "Test User",
            "organisation": "Test Sciences",
            "hours": 304.06611111111,
            "cost": 181.07456563574
          },
          {
            "cores": 384,
            "cpu_seconds": 19007392,
            "job_count": 12,
            "owner": "tuser",
            "queue": "bigmem",
            "contactid": "bbbe71c5-vvvv-e611-80e3-c4346bc43f98",
            "username": "tuser",
            "email": "test.user@test.com",
            "unit": "Test Sciences",
            "manager": "Test User",
            "billing": "Test University",
            "fullname": "Test User",
            "organisation": "Test Sciences",
            "hours": 5279.8311111111,
            "cost": 3144.1949304411
          },
          {
            "cores": 1,
            "cpu_seconds": 600,
            "job_count": 1,
            "owner": "awombat",
            "queue": "bigmem",
            "contactid": "aaae71c5-vvvv-e611-80e3-c4346bc43f98",
            "username": "awombat",
            "email": "a.wombat@test.com",
            "unit": "Test Sciences",
            "manager": "A Wombat",
            "billing": "Test University",
            "fullname": "A Wombat",
            "organisation": "Test Sciences",
            "hours": 13.505,
            "cost": 44.834
          }
        ]
        var result = objectUnderTest.createUserRollup(detailRows)
        expect(result.isAllSuccess).toBeTruthy()
        expect(result.errors.length).toBe(0)
        var rollupResult = result.rollupResult
        expect(rollupResult.length).toBe(2)
        var firstRecord = rollupResult[0]
        expect(firstRecord.username).toBe('tuser')
        expect(firstRecord.job_count).toBe(32 + 12)
        expect(firstRecord.hours).toBe(304.06611111111 + 5279.8311111111)
        expect(firstRecord.cost).toBe(181.07456563574 + 3144.1949304411)
        expect(firstRecord.cores).toBe(32 + 384)
        expect(firstRecord.cpu_seconds).toBe(1094638 + 19007392)
        var secondRecord = rollupResult[1]
        expect(secondRecord.username).toBe('awombat')
        expect(secondRecord.job_count).toBe(1)
        expect(secondRecord.hours).toBe(13.505)
        expect(secondRecord.cost).toBe(44.834)
        expect(secondRecord.cores).toBe(1)
        expect(secondRecord.cpu_seconds).toBe(600)
      })
    })
  })
})
