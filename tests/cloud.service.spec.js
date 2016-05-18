// angular-spinner has amd format which is different to app define
define(['../lib/angular-spinner/angular-spinner.min.js', 'cloud/services'], function() {
  describe('Cloud.service.flavor', function() {
    var $httpBackend, flavorFactory;
    var url = '/nova';
    var endpoint = url + '/flavor';

    beforeEach(module('reportingApp'));
    beforeEach(inject(function($injector) {

      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.when('GET', endpoint).respond(200, [{
        openstack_id: 1,
        disk: 0
      }, {
        openstack_id: 2,
        disk: 20
      }]);

      flavorFactory = $injector.get('flavor');

    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should fetch flavor when called first time', function() {
      $httpBackend.expectGET(endpoint);
      flavorFactory(url);
      $httpBackend.flush();
    });

    it('should only call server once for the same query', function() {
      $httpBackend.expectGET(endpoint);
      var promise = flavorFactory(url), result;
      $httpBackend.flush();
      promise.then(function(d) {
        result = d;
        expect(result).toBeDefined();
      });

      var promise2 = flavorFactory(url);
      expect($httpBackend.flush).toThrowError('No pending request to flush !');
      promise2.then(function(d) {
        expect(d).toEqual(result);
      });
    });
  });

  describe('Cloud.service.tenant', function() {
    var $httpBackend, tenantFactory;
    var endpoint = '/keystone';
    var url = /\/keystone\/tenant\?filter=openstack_id\.eq\.(.+)$/;

    beforeEach(module('reportingApp'));
    beforeEach(inject(function($injector) {

      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.when('GET', url, undefined, undefined, ['openstack_id']) // eslint-disable-line no-undefined
        .respond(function(method, url, data, headers, params) { // eslint-disable-line no-shadow
          var result = {};
          if (params.openstack_id == 'stack_id') {
            result = {
              id: 1,
              openstack_id: 'stack_id',
              allocation: 1,
              name: 'tenant1',
              description: 'description 1'
            };
          }
          return [200, [result]];
        });
      tenantFactory = $injector.get('tenant');

    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should has filter in query string in the defined pattern', function() {
      $httpBackend.expectGET('/keystone/tenant?filter=openstack_id.eq.some_id');
      var tq = tenantFactory(endpoint);
      tq('some_id');
      $httpBackend.flush();
    });

    function withExistId() {
      $httpBackend.expectGET(url);
      var tq = tenantFactory(endpoint);
      var promise = tq('stack_id');
      $httpBackend.flush();
      return promise;
    }

    it('should return a map either empty or has values', function() {
      withExistId();

      var tq = tenantFactory(endpoint),
        promise = tq('non-exists');

      $httpBackend.flush();
      promise.then(function(d) {
        expect(Object.keys(d).length).toEqual(0);
      });
    });

    it('should only call server once for the same query', function() {
      var promise = withExistId(), result;
      promise.then(function(d) {
        result = d;
        expect(Object.keys(result).length).not.toBeLessThan(3);
      });

      var tq2 = tenantFactory(endpoint),
        promise2 = tq2('stack_id');
      expect($httpBackend.flush).toThrowError('No pending request to flush !');
      promise2.then(function(d) {
        expect(d).toEqual(result);
      });
    });

  });
});
