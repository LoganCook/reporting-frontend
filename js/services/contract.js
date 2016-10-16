  define(['util'], function (util) {
    'use strict';

    // Service/Contract related
    // returned a map with keyName as key, contractor and attributes as content
    return function Contract($http, $q, org, service, keyName) {
      if (!sessionStorage.hasOwnProperty('bman')) {
        throw "Wrong configuration: bman is not defined in sessionStorage.";
      }
      var requestUrl = sessionStorage['bman'],
        serviceUrl = requestUrl + '/api/' + service + '/',
        contracts = null;

      return {
        getAll: function () {
          var deferred = $q.defer();
          if (contracts) {
            deferred.resolve(contracts);
          } else {
            $http.get(serviceUrl).then(function (response) {
              // /api/rds/ returns raw django model with contractor role as ids, so we have to map them
              var roles = org.getAllRoles();
              var extended = response.data.map(function(entry) {
                angular.extend(entry, roles[entry['contractor']]);
                return entry;
              });
              contracts = util.keyArray(extended, keyName);
              deferred.resolve(contracts);
            });
          }
          return deferred.promise;
        },
        getServiceOf: function (orgId) {
          var deferred = $q.defer();
          org.getServiceOf(orgId, service).then(function(data) {
            deferred.resolve(util.keyArray(data, keyName));
          });
          return deferred.promise;
        }
      };
    };
  });