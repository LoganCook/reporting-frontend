  define(['app', 'util'], function (app, util) {
    'use strict';

    // Cacheable organisation-user data for all pages, mandatory
    app.factory('org', function ($http, $q) {
      if (sessionStorage.hasOwnProperty('secret') && !sessionStorage.hasOwnProperty('bman')) {
        throw "Wrong configuration: bman is not defined in sessionStorage.";
      }
      var requestUri = sessionStorage['bman'];
      var userUri = requestUri + '/api/Organisation/#id/get_extended_accounts/';
      var orgUri = requestUri + '/api/Organisation/?method=get_tops';
      var orgServiceUri = requestUri + '/api/organisation/#id/get_service/?name=#serviceName';
      var rdsUri = requestUri + '/api/RDS/';
      var roleUri = requestUri + '/api/Role/';
      var organisations = {}, // pk -> name
        organisationByNames = {}, // name -> pk
        users = {},
        mergedUsers = {},
        rdses = [],
        roleDict = {},
        roles = [],
        rolesOf = {},  // to replace roles which does not well target different logged in users, security concern
        mergedRoles = {},
        services = {};

      function _getUsersOf(orgId) {
        var deferred = $q.defer();
        if (orgId in users) {
          deferred.resolve(users[orgId]);
        } else {
          $http.get(userUri.replace("#id", orgId)).then(function (response) {
            if (Object.keys(response.data).length == 0) {
              deferred.resolve({});
            } else {
              users[orgId] = response.data;

              var organisationName = organisations[orgId];
              for (var user in users[orgId]) {
                users[orgId][user]['billing'] = organisationName;
                if (users[orgId][user]['billing'] == users[orgId][user]['organisation']) {
                  users[orgId][user]['organisation'] = '&nbsp;';
                }
              }
              // async? relatinoship with getMergedUsers?
              angular.extend(mergedUsers, users[orgId]);
              deferred.resolve(users[orgId]);
            }

            //   Below line works?
            // deferred.resolve(organisations);
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
       * @param {number} orgId, bman's pk
       * @param {string} name, name of a service: accessservice, nectar, rds
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
            // the services are in this format:
            // {[{}]}
            var i, j, l = response.data.length, nestedL = 0, tempArray = [];
            for (i = 0; i < l; i++ ) {
              nestedL = response.data[i].length;
              for (j = 0; j < nestedL; j++) {
                tempArray.push(response.data[i][j]);
              }
            }
            services[orgId][name] = tempArray;
            deferred.resolve(services[orgId][name]);
          });
        }
        return deferred.promise;
      }

      function getMergedRoles() {
        for (var orgId in rolesOf) {
          rolesOf[orgId].forEach(function (role) {
            angular.extend(mergedRoles, role);
          });
        }
      }

      function _getRolesOf(orgId) {
        var deferred = $q.defer();
        if (orgId in rolesOf) {
          deferred.resolve(rolesOf[orgId]);
        } else {
          var url = requestUri + '/api/organisation/' + orgId + '/get_all_roles/';
          $http.get(url).then(function (response) {
            rolesOf[orgId] = _getSimpleRoles(response.data, organisations[orgId]);
            deferred.resolve(rolesOf[orgId]);
          });
        }
        return deferred.promise;
      }

      /**
       * Extract some fields from Bman's role model
       *
       * @param {Array} roles: role id as key and the rest of fields in object
       */
      function _getSimpleRoles(roleModels, billing) {
        return roleModels.map(function (roleModel) {
          var simpleRole = {};
          simpleRole[roleModel['id']] = roleModel;
          simpleRole[roleModel['id']]['billing'] = billing;
          if (simpleRole[roleModel['id']]['billing'] == simpleRole[roleModel['id']]['organisation']) {
            simpleRole[roleModel['id']]['organisation'] = '&nbsp;';
          }
          return simpleRole;
        });
      }


      return {
        getOrganisations: function (loadUsers) {
          var deferred = $q.defer();
          if (Object.keys(organisations).length > 0) {
            deferred.resolve(organisations);
          } else {
            $http.get(orgUri).then(function (response) {
              // organisations = response.data;
              for (var i = 0; i < response.data.length; i++) {
                organisations[response.data[i]['pk']] = response.data[i]['name'];
                organisationByNames[response.data[i]['name']] = response.data[i]['pk'];
                if (loadUsers) {
                  _getUsersOf(response.data[i]['pk']);
                  _getRolesOf(response.data[i]['pk']);
                }
              }
              deferred.resolve(organisations);
            });
          }
          return deferred.promise;
        },
        getOrganisationId: function (name) {
          return organisationByNames[name];
        },
        getUsersOf: function (orgId) {
          // will load all user accounts (AccessService) and Roles
          return _getUsersOf(orgId).then(function () {
            return _getRolesOf(orgId);
          });
        },
        getUsersOfSync: function (orgName) {
          var orgId = organisationByNames[orgName];
          if (orgId in users) {
            return users[orgId];
          } else {
            throw "You have to modify code to ensure users are availabe when called.";
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
        getRDS: function () {
          var deferred = $q.defer();
          if (rdses.length) {
            deferred.resolve(rdses);
          } else {
            $http.get(rdsUri).then(function (response) {
              rdses = util.keyArray(response.data, 'filesystem');
              deferred.resolve(rdses);
            });
          }
          return deferred.promise;
        },
        getRoles: function () {
          var deferred = $q.defer();
          if (roles.length) {
            deferred.resolve(roles);
          } else {
            $http.get(roleUri).then(function (response) {
              roles = response.data;
              deferred.resolve(roles);
            });
          }
          return deferred.promise;
        },
        getRole: function (roleId) {
          var deferred = $q.defer();
          if (roleId in roleDict) {
            deferred.resolve(roleDict[roleId]);
          } else {
            $http.get(roleUri + roleId + '/').then(function (response) {
              roleDict[roleId] = response.data;
              deferred.resolve(roleDict[roleId]);
            });
          }
          return deferred.promise;
        },
        getServiceOf: function (orgId, name) {
          return _getServiceOf(orgId, name);
        },
        getRolesOfSync: function (orgName) {
          var orgId = organisationByNames[orgName];
          if (orgId in rolesOf) {
            return rolesOf[orgId];
          } else {
            throw "You have to modify code to ensure users are availabe when called.";
          }
        },
        getAllRoles: function () {
          // return preloaded roles
          if (Object.keys(mergedRoles).length == 0) {
            getMergedRoles();
          }
          return mergedRoles;
        }
      };
    });
  });