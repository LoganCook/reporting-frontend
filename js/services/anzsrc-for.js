  define(['app'], function (app) {
    'use strict';

    // ANZSRC-FOR codes
    // returned a map with salesorderid as key, ANZSRC-FOR codes in an array as value
    app.factory('FORService', function ($http, $q, org) {
      if (!sessionStorage.hasOwnProperty('bman')) {
        throw new Error("Wrong configuration: bman is not defined in sessionStorage.");
      }
      var requestUri = sessionStorage['bman'],
        forUri = requestUri + '/api/anzsrc-for/',
        anzsrcFORs = null;

      return {
        getAll: function () {
          var deferred = $q.defer();
          if (anzsrcFORs) {
            deferred.resolve(anzsrcFORs);
          } else {
            $http.get(forUri).then(function (response) {
              anzsrcFORs = response.data;
              deferred.resolve(anzsrcFORs);
            });
          }
          return deferred.promise;
        },
        getFORsOf: function (orgId) {
          // attachedstorage and attachedbackupstorage are in the same order, so, cheat here: only check one
          // TODO: when re-write, do not cheat, chain rds and rdsbackup (?)
          return org.getFORsOf(orgId, 'attachedstorage');
        }
      };
    });
  });