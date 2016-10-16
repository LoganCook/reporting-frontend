define(['../lib/angular-spinner/angular-spinner.min.js', 'services/org','services/auth' ,'services/xfs'], function () {
  // FIXME: has to disable check in org.js in sessionStorage because the dependices
  describe('XFSService', function () {
    var $httpBackend, hpcFactory;
    beforeEach(module('reportingApp'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      hpcFactory = $injector.get('XFSService');
    }));

    describe('getPromise', function () {
      it('should have hit backend', inject(function () {
        $httpBackend.expectGET('undefined/filesystem/aae613c6-e687-4127-8b14-65aa6ff77d68/summary?start=1475245800&end=1477920600')
          .respond([{
            username: 'test'
          }]);

        hpcFactory.query('aae613c6-e687-4127-8b14-65aa6ff77d68', 1475245800, 1477920600);

        $httpBackend.flush();

      }));

    });
  });
});