  define(['app', 'util'], function (app, util) {
    'use strict';

    // RDS related
    // returned a map with filesystem as key, contractor and attributes as content
    app.factory('RDService', function ($http, $q, org) {
      if (!sessionStorage.hasOwnProperty('bman')) {
        throw "Wrong configuration: bman is not defined in sessionStorage.";
      }
      var requestUri = sessionStorage['bman'],
        rdsUri = requestUri + '/api/rds/',
        rdses = null;

      return {
        getAll: function () {
          var deferred = $q.defer();
          if (rdses) {
            deferred.resolve(rdses);
          } else {
            $http.get(rdsUri).then(function (response) {
              // /api/rds/ returns raw django model with contractor role as ids, so we have to map them
              var roles = org.getAllRoles();
              var extended = response.data.map(function(entry) {
                angular.extend(entry, roles[entry['contractor']]);
                return entry;
              });
              rdses = util.keyArray(extended, 'filesystem');
              deferred.resolve(rdses);
            });
          }
          return deferred.promise;
        },
        getServiceOf: function (orgId) {
          var deferred = $q.defer();
          org.getServiceOf(orgId, 'rds').then(function(data) {
            deferred.resolve(util.keyArray(data, 'filesystem'));
          });
          return deferred.promise;
        }
      };
    });
  });