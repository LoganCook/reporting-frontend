  define(['app', 'util'], function (app, util) {
    'use strict';

    function tempMap(data) {
      // Hope this is a tempory solution
      data.forEach(function(entry) {
        entry['billing'] = entry['biller'];
        entry['organisation'] = entry['unit'];
        entry['full_name'] = entry['manager'];
        entry['contractor'] = entry['manager'];
        entry['allocation_num'] = entry['orderId'];
        entry['approved_size'] = entry['allocated'];
      });
    }

    // RDS related
    // returned a map with filesystem as key, contractor and attributes as content
    // TODO: can this be a warper of Contract, they look identical but called in different ways
    app.factory('RDService', function ($http, $q, org) {
      if (!sessionStorage.hasOwnProperty('bman')) {
        throw "Wrong configuration: bman is not defined in sessionStorage.";
      }
      var requestUri = sessionStorage['bman'],
        rdsUri = requestUri + '/api/rds/',
        rdsBackupUri = requestUri + '/api/rdsbackup/',
        rdses = null;

      return {
        getAll: function () {
          var deferred = $q.defer();
          if (rdses) {
            deferred.resolve(rdses);
          } else {
            $http.get(rdsUri).then(function (response) {
              $http.get(rdsBackupUri).then(function(rdsBackUpResponse) {
                var combined = response.data.concat(rdsBackUpResponse.data);
                tempMap(combined);
                rdses = util.keyArray(combined, 'FileSystemName');
                deferred.resolve(rdses);
              });
            });
          }
          return deferred.promise;
        },
        getServiceOf: function (orgId) {
          var deferred = $q.defer();
          org.getServiceOf(orgId, 'rds').then(function(rdsData) {
            org.getServiceOf(orgId, 'rdsbackup').then(function(rdsBackupdata) {
              var combined = rdsData.concat(rdsBackupdata);
              tempMap(combined);
              deferred.resolve(util.keyArray(combined, 'FileSystemName'));
            });
          });
          return deferred.promise;
        }
      };
    });
  });