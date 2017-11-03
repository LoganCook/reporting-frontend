  define(
    ['app', 'util', "../countdown-latch"],
    function (app, util, countdownLatch) {
    'use strict';

    // Cacheable organisation-user data for all pages, mandatory
    app.factory('org', function ($http, $q, theConstants) {
      if (sessionStorage.hasOwnProperty('secret') && !sessionStorage.hasOwnProperty('bman')) {
        throw new Error("Wrong configuration: bman is not defined in sessionStorage.");
      }
      var requestUri = sessionStorage['bman'];
      var userUri = requestUri + '/api/Organisation/#id/get_access/';
      var orgUri = requestUri + '/api/Organisation/?method=get_tops';
      var orgServiceUri = requestUri + '/api/organisation/#id/get_service/?name=#serviceName';
      var orgFORUri = requestUri + '/api/organisation/#id/get_for/?product=#productName';
      var rdsUri = requestUri + '/api/v2/contract/attachedstorage/';
      var organisations = {}, // pk -> name
        organisationByNames = {}, // name -> pk
        users = {},
        mergedUsers = {},
        services = {},
        anzsrcFORs = {};

      function _getUsersOf(orgId) {
        var deferred = $q.defer();
        if (angular.isUndefined(orgId)) {
          deferred.resolve({});
        } else if (orgId in users) {
          deferred.resolve(users[orgId]);
        } else {
          $http.get(userUri.replace("#id", orgId)).then(function (response) {
            if (Object.keys(response.data).length == 0) {
              deferred.resolve({});
            } else {
              users[orgId] = util.keyArray(response.data, 'username');

              var organisationName = organisations[orgId];
              for (var user in users[orgId]) {
                users[orgId][user]['billing'] = organisationName;
                // temporary mapping
                users[orgId][user]['fullname'] = users[orgId][user]['manager'];
                if (users[orgId][user]['billing'] == users[orgId][user]['unit']) {
                  users[orgId][user]['organisation'] = theConstants.blankValue;
                } else {
                  users[orgId][user]['organisation'] = users[orgId][user]['unit'];
                }
              }
              // async? relatinoship with getMergedUsers?
              angular.extend(mergedUsers, users[orgId]);
              deferred.resolve(users[orgId]);
            }

            //   Below line works?
            // deferred.resolve(organisations);
          }, function(reason) {
            deferred.reject(reason);
          });
        }
        return deferred.promise;
      }

      function getMergedUsers() {
        // FIXME: promise.all org in organisations
        // If this is a promise, getAllUsers will be redundant
        for (var orgId in users) {
          angular.extend(mergedUsers, users[orgId]);
        }
      }

      /**
       * @description Get information of a type of service of an organisation
       *
       * @param {number} orgId, internal id - primary key
       * @param {string} name, name of a product: nectar, rds, rdsbackup, hpc (hpc home storage), ersaaccount, ersastorage, ersastoragebackup
       * @returns promise
       */
      function _getServiceOf(orgId, name) {
        // bman currently does not return account name with it?!
        var deferred = $q.defer();
        if (orgId in services && name in services[orgId]) {
          deferred.resolve(services[orgId][name]);
        } else {
          // FIXME: need to use native resource url and its replacement
          var interpolatedUrl = orgServiceUri.replace("#id", orgId).replace("#serviceName", name);
          $http.get(interpolatedUrl).then(function (response) {
            if (!(orgId in services)) {
              services[orgId] = {};
            }
            // Dynamics for this query does not have billing, biller, orgName, add it for summary functions.
            var i, l = response.data.length;
            var orgName = organisations[orgId];
            for (i = 0; i < l; i++ ) {
              response.data[i]['billing'] = orgName;
              // below is temporary mapping of biller to billing for minising templates changes
              response.data[i]['biller'] = orgName;
              response.data[i]['organisation'] = response.data[i]['unit'];
              response.data[i]['contractor'] = response.data[i]['manager'];
            }
            services[orgId][name] = response.data;
            deferred.resolve(services[orgId][name]);
          }, function(reason) {
            deferred.reject(reason);
          });
        }
        return deferred.promise;
      }

      /**
       * @description Get FOR codes of orders of a product of an organisation
       *
       * @param {number} orgId, internal id - primary key
       * @param {string} name, name of a product, mainly rds and rdsbackup
       * @returns promise
       */
      function _getFORsOf(orgId, name) {
        var deferred = $q.defer();
        if (orgId in anzsrcFORs && name in anzsrcFORs[orgId]) {
          deferred.resolve(anzsrcFORs[orgId][name]);
        } else {
          // FIXME: need to use native resource url and its replacement
          var interpolatedUrl = orgFORUri.replace("#id", orgId).replace("#productName", name);
          $http.get(interpolatedUrl).then(function (response) {
            if (!(orgId in anzsrcFORs)) {
              anzsrcFORs[orgId] = {};
            }
            anzsrcFORs[orgId][name] = response.data;
            deferred.resolve(anzsrcFORs[orgId][name]);
          }, function(reason) {
            deferred.reject(reason);
          });
        }
        return deferred.promise;
      }

      return {
        getOrganisations: function (loadUsers) {
          var deferred = $q.defer();
          if (Object.keys(organisations).length > 0) {
            deferred.resolve(organisations);
          } else {
            $http.get(orgUri).then(function (response) {
              var numberOfServiceCalls = response.data.length;
              var latch = new countdownLatch(numberOfServiceCalls);
              latch.await(function() {
                deferred.resolve(organisations);
              });
              for (var i = 0; i < response.data.length; i++) {
                organisations[response.data[i]['id']] = response.data[i]['name'];
                organisationByNames[response.data[i]['name']] = response.data[i]['id'];
                if (loadUsers) {
                  _getUsersOf(response.data[i]['id']).finally(function () {
                    latch.countDown();
                  });
                }
              }
              if (!loadUsers) {
                deferred.resolve(organisations);
              }
            }, function(reason) {
              deferred.reject(reason);
            });
          }
          return deferred.promise;
        },
        getOrganisationId: function (name) {
          return organisationByNames[name];
        },
        getUsersOf: function (orgId) {
          // will load all user accounts (AccessService) and Roles
          return _getUsersOf(orgId);
        },
        getUsersOfSync: function (orgName) {
          var orgId = organisationByNames[orgName];
          if (orgId in users) {
            return users[orgId];
          } else {
            throw new Error("You have to modify code to ensure users are availabe when called.");
          }
        },
        getAllAccounts: function () {
          // return preloaded users
          if (Object.keys(mergedUsers).length == 0) {
            getMergedUsers();
          }
          return mergedUsers;
        },
        getAllUsers: function () {
          // FIXME: to move caller of this function to getAccounts
          var deferred = $q.defer();
          deferred.resolve(users);
          return deferred.promise;
        },
        getBillings: function () {
          var deferred = $q.defer();
          deferred.resolve(organisations);
          return deferred.promise;
        },
        getServiceOf: function (orgId, name) {
          return _getServiceOf(orgId, name);
        },
        getFORsOf: function (orgId, name) {
          return _getFORsOf(orgId, name);
        }
      };
    });
  });