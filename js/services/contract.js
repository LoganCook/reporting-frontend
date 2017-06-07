  define(['util'], function (util) {
    'use strict';

    // Service/Contract related
    // returned a map with keyName as key, contractor and attributes as content
    return function Contract($http, $q, org, service, keyName, AuthService) {
      if (!sessionStorage.hasOwnProperty('bman')) {
        throw new Error("Wrong configuration: bman is not defined in sessionStorage.");
      }
      var requestUrl = sessionStorage['bman'],
        serviceUrl = requestUrl + '/api/' + service + '/',
        contracts = null;

      return {
        getContracts: function() {
          var promise;
          if (AuthService.isAdmin()) {
            promise = this.getAll();
          } else {
            promise = this.getServiceOf(org.getOrganisationId(AuthService.getUserOrgName()));
          }
          return promise;
        },
        getAll: function () {
          var deferred = $q.defer();
          if (contracts) {
            deferred.resolve(contracts);
          } else {
            $http.get(serviceUrl).then(function (response) {
              // TODO: to be aware: some places rely on organisation which should be (manager/leader/role)unit
              contracts = util.keyArray(response.data, keyName);
              deferred.resolve(contracts);
            });
          }
          return deferred.promise;
        },
        getServiceOf: function (orgId) {
          var deferred = $q.defer();
          // TODO: to be aware: some places rely on organisation which should be (manager/leader/role)unit
          org.getServiceOf(orgId, service).then(function(data) {
            deferred.resolve(util.keyArray(data, keyName));
          });
          return deferred.promise;
        }
      };
    };
  });