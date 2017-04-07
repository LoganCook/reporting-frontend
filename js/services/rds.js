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
        rdsReportUri = requestUri + '/api/rdsreport/',
        rdses = null,
        reportMeta = null,
        getAllPromise = null;

      function doGetAll() {
        if (getAllPromise) {
          // ensures when multiple calls are triggered at once that they all wait for one HTTP call to resolve
          return getAllPromise
        }
        var deferred = $q.defer()
        if (rdses) {
          deferred.resolve(rdses)
        } else {
          $http.get(rdsUri).then(function (response) {
            $http.get(rdsBackupUri).then(function(rdsBackUpResponse) {
              var combined = response.data.concat(rdsBackUpResponse.data)
              tempMap(combined)
              rdses = util.keyArray(combined, 'FileSystemName')
              deferred.resolve(rdses)
            }, function(reason) {
              var message = 'Failed during call to RDS backup URL'
              console.error(message)
              deferred.reject(message)
            })
          }, function(reason) {
            var message = 'Failed during call to RDS primary URL'
            console.error(message)
            deferred.reject(message)
          })
        }
        getAllPromise = deferred.promise
        return getAllPromise
      }

      return {
        getAll: function () {
          var deferred = $q.defer();
          doGetAll().then(function(response) {
            deferred.resolve(response)
          }, function(reason) {
            deferred.reject()
          })
          return deferred.promise;
        },
        getServiceMeta: function () {
          // Certain reports need extra meta data other than normal basic Order info,
          // deal with them here
          var deferred = $q.defer();
          if (reportMeta) {
            deferred.resolve(reportMeta);
          } else {
            $http.get(rdsReportUri).then(function (response) {
              reportMeta = util.keyArray(response, 'FileSystemName');
              deferred.resolve(reportMeta);
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
            }, function(reason) {
              deferred.reject(reason)
            });
          }, function(reason) {
            deferred.reject(reason)
          });
          return deferred.promise;
        },
        getServiceMetaOf: function (orgId, reportName) {
          // Certain reports need extra meta data other than normal basic Order info,
          // deal with them here
          var deferred = $q.defer();
          org.getServiceOf(orgId, reportName).then(function(metaData) {
              deferred.resolve(util.keyArray(metaData, 'FileSystemName'));
          });
          return deferred.promise;
        }
      };
    });
  });