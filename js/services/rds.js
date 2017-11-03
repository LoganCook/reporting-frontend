  define(['app', 'util'], function (app, util) {
    'use strict';

    // Conversion factor of annual price in GB to 250 GB/Block/month
    var CONVERTFACTOR = 0.048; // 12/250

    function tempMap(data) {
      // Hope this is a tempory solution
      data.forEach(function(entry) {
        mapField(entry, 'billing', 'biller')
        mapField(entry, 'organisation', 'managerunit')
        mapField(entry, 'full_name', 'manager')
        mapField(entry, 'contractor', 'manager')
        mapField(entry, 'allocation_num', 'orderID')
        mapField(entry, 'approved_size', 'allocated')
      });
    }

    function mapField (object, fieldNameTo, fieldNameFrom) {
      if (!object[fieldNameFrom]) {
        console.warn('Data problem: About to set field "' + fieldNameTo + '" to undefined because field "' + fieldNameFrom + '" is not present')
      }
      // TODO could check if we're overwriting a field with a different value
      object[fieldNameTo] = object[fieldNameFrom]
    }

    // RDS related
    // returned a map with filesystem as key, contractor and attributes as content
    // TODO: can this be a warper of Contract, they look identical but called in different ways
    app.factory('RDService', function ($http, $q, org) {
      if (!sessionStorage.hasOwnProperty('bman')) {
        throw new Error("Wrong configuration: bman is not defined in sessionStorage.");
      }
      var requestUri = sessionStorage['bman'],
        rdsUri = requestUri + '/api/v2/contract/attachedstorage/',
        rdsBackupUri = requestUri + '/api/v2/contract/attachedbackupstorage/',
        rdsReportUri = requestUri + '/api/rdsreport/',
        rdses = null,
        reportMeta = null,
        getAllPromise = null,
        getServiceOfPromise = null;

      function doGetAll() {
        if (getAllPromise) {
          // ensures when multiple calls are triggered at once that they all wait for one HTTP call to resolve
          return getAllPromise;
        }
        var deferred = $q.defer();
        if (rdses) {
          deferred.resolve(rdses);
        } else {
          $http.get(rdsUri).then(function (response) {
            $http.get(rdsBackupUri).then(function(rdsBackUpResponse) {
              var combined = response.data.concat(rdsBackUpResponse.data);
              tempMap(combined)
              rdses = util.keyArray(combined, 'FileSystemName');
              util.convertContractPrice(rdses, CONVERTFACTOR);
              deferred.resolve(rdses)
            }, function(reason) {
              var message = 'Failed during call to attached backup storage URL';
              console.error(message);
              deferred.reject(message);
            })
          }, function(reason) {
            var message = 'Failed during call to attached storage URL';
            console.error(message);
            deferred.reject(message);
          })
        }
        getAllPromise = deferred.promise;
        return getAllPromise;
      }

      function doGetServiceOf(orgId) {
        if (getServiceOfPromise) {
          // ensures when multiple calls are triggered at once that they all wait for one HTTP call to resolve
          return getServiceOfPromise;
        }
        var deferred = $q.defer();
        org.getServiceOf(orgId, 'attachedstorage').then(function(rdsData) {
          org.getServiceOf(orgId, 'attachedbackupstorage').then(function(rdsBackupdata) {
            var combined = rdsData.concat(rdsBackupdata);
            tempMap(combined);
            combined = util.keyArray(combined, 'FileSystemName');
            util.convertContractPrice(combined, CONVERTFACTOR);
            deferred.resolve(combined);
          }, function(reason) {
            deferred.reject(reason);
          });
        }, function(reason) {
          deferred.reject(reason);
        });
        getServiceOfPromise = deferred.promise;
        return getServiceOfPromise;
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
          doGetServiceOf(orgId).then(function (response) {
            deferred.resolve(response);
          }, function(reason) {
            deferred.reject(reason);
          });
          return deferred.promise;
        },
        getServiceMetaOf: function (orgId, reportName) {
          // Certain reports need extra meta data other than normal basic Order info,
          // deal with them here
          var deferred = $q.defer();
          org.getServiceOf(orgId, reportName).then(function(metaData) {
              deferred.resolve(util.keyArray(metaData, 'FileSystemName'));
          }, function(reason) {
            deferred.reject(reason);
          });
          return deferred.promise;
        },
        // FIXME: verify if this or the above is needed, or can be merged
        getServiceMetaArrayOf: function (orgId, reportName) {
          // Certain reports need extra meta data other than normal basic Order info,
          // deal with them here
          var deferred = $q.defer();
          org.getServiceOf(orgId, reportName).then(function(metaData) {
              deferred.resolve(metaData);
          }, function(reason) {
            deferred.reject(reason);
          });
          return deferred.promise;
        }
      };
    });
  });