'use strict'
define(['../lib/angular-spinner/angular-spinner.min.js', 'services/org','services/auth' ,'services/xfs'], function () {
  describe('XFSService', function () {
    var $httpBackend
    var rootScope
    var objectUnderTest

    beforeEach(module('reportingApp'));

    beforeEach(inject(function ($injector, $rootScope) {
      $httpBackend = $injector.get('$httpBackend');
      rootScope = $rootScope
      var org = $injector.get('org');
      objectUnderTest = $injector.get('XFSService');
      spyOn(org, 'getUsersOfSync').and.returnValue({
        "utest":{
          "contactid":"0caa0511-b362-e611-80e3-c4346bc43f98",
          "username":"utest",
          "unit":"School of Test",
          "manager":"User Test",
          "email":"user.test@test.com",
          "billing":"University of Test",
          "fullname":"User Test",
          "organisation":"School of Test"}
      })
    }));

    describe('query function', function () {
      var isResolvedSuccessfully = false

      beforeEach(function(done) {
        $httpBackend.expectGET('undefined/filesystem/aae613c6-e687-4127-8b14-65aa6ff77d68/summary?start=1475245800&end=1477920600')
          .respond([{
            username: 'test'
          }]);

        var result = objectUnderTest.query('aae613c6-e687-4127-8b14-65aa6ff77d68', 1475245800, 1477920600);
        result.then(function(isSuccess) {
          isResolvedSuccessfully = isSuccess
          done()
        })
        rootScope.$apply()
        $httpBackend.flush()
      })

      it('should successfully resolve promise', function() {
        expect(isResolvedSuccessfully).toBe(true)
      })
    });
  });
});