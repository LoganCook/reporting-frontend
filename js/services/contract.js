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
              contracts = util.keyArray(response.data, keyName);
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