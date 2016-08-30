define(["client", "ng-csv", , "components/datePickers/date-pickers"], function(clientConstructor) {
    var app = angular.module("reportingApp", ["ngSanitize", "ui.router", "ui.bootstrap", "ngResource", "ngCsv", "angularSpinner", "pageComponents"]);
    app.factory("reporting", ["$timeout", "queryResource", clientConstructor]);
    app.config(['$resourceProvider', function($resourceProvider) {
      // Don't strip trailing slashes from calculated URLs to make Django URLs work
      $resourceProvider.defaults.stripTrailingSlashes = false;
    }])
    // cannot do global headers.common: it messes up bman CROS
    // .run(function($http) {$http.defaults.headers.common["x-ersa-auth-token"] = sessionStorage["secret"]})
    ;
    
    /* global _ */
     
    //Global search form for all pages
    app.directive('ersaSearch',  function () {
        return {
            restrict: "AE",
            controller: function ($scope, $element, $attrs) {

                $scope.dateOptions = {
                    //dateDisabled: true,
                    maxDate: new Date()
                };

                /**
                 * Initialize start and end data.
                 * Each controller can still set up start and end date.
                 */
                if (!angular.isDefined($scope.load)) {
                    alert('load function is not defined ..');
                }
                if (!angular.isDefined($scope.export)) {
                    alert('export function is not defined ..');
                }

                if (!angular.isDefined($scope.rangeStart)) {
                    var startDate = new Date();
                    startDate.setMonth(startDate.getMonth() - 1);
                    $scope.rangeStart = startDate;
                }

                if (!angular.isDefined($scope.rangeEnd)) {
                    $scope.rangeEnd = new Date();
                }

                if (!angular.isDefined($scope.openRangeStart)) {
                    $scope.rangeStartOpen = false;
                    $scope.openRangeStart = function() {
                        $scope.rangeStartOpen = true;
                    };
                }

                if (!angular.isDefined($scope.openRangeEnd)) {
                    $scope.rangeEndOpen = false;
                    $scope.openRangeEnd = function() {
                        $scope.rangeEndOpen = true;
                    };
                }


                /**
                 * If each class is defined , assigne to
                 */

                if (!angular.isDefined($attrs.exportFileName)) {
                    alert('Export File Name is not defined ..');
                } else {
                   $scope.exportFileName = $attrs.exportFileName;
                }

                if (angular.isDefined($attrs.startDateClass)) {
                    $scope.startDateClassName = $attrs.startDateClass;
                }
                if (angular.isDefined($attrs.endDateClass)) {
                    $scope.endDateClassName = $attrs.endDateClass;
                }
                if (angular.isDefined($attrs.buttonClass)) {
                    $scope.buttonClassName = $attrs.buttonClass;
                }


                /**
                 * start Util fuctions
                 */
                var getSearchDateFilter = function(scope) {

                    if (scope.rangeStart > scope.rangeEnd) {
                        scope.alerts.push({type: 'danger',msg: "Date options is invalid!"});
                        return '';
                    }

                    var rangeStartEpoch = dayStart(scope.rangeStart);
                    var rangeEndEpoch = dayEnd(scope.rangeEnd);

                    var filter =  {
                            filter: [
                                "end.ge." + rangeStartEpoch,
                                "end.lt." + rangeEndEpoch
                            ]
                        };
                    return filter;
                };

                // FIXME: are there any differences between dayStart and dayEnd here and those in util.js?
                var dayStart = function(ts) {
                    var modified = new Date(ts);

                    modified.setHours(0);
                    modified.setMinutes(0);
                    modified.setSeconds(0);
                    modified.setMilliseconds(0);

                    return Math.round(modified.getTime() / 1000);
                };

                var dayEnd = function(ts) {
                    var modified = new Date(ts);

                    modified.setHours(23);
                    modified.setMinutes(59);
                    modified.setSeconds(59);
                    modified.setMilliseconds(999);

                    return Math.round(modified.getTime() / 1000);
                };

                /**
                 * end Util fuctions
                 */

                /**
                 * Wrapping functions
                 */
                $scope._load = function() {
                    var rangeEpochFilter = getSearchDateFilter($scope);
                    if (rangeEpochFilter == '') {
                        return;
                    }

                    // FIXME: nova.js load has its own rangeEpochFilter
                    $scope.load(rangeEpochFilter);
                };

                $scope._export = function() {
                    return $scope.export();
                };
            },
            templateUrl: 'template/directives/ersa-search.html'
        };
    });


    //Cacheable organisation-user data for all pages
    app.factory('org', function($http, $q) {
        // FIXME: This is different to any other sources: not using client.js to get data.
        // They should be unified.
        if (!sessionStorage.hasOwnProperty('bman')) {
          throw "Wrong configuration: bman is not defined in sessionStorage.";
        }
        var requestUri = sessionStorage['bman'];
        // TODO: verify below two api urls
        //var userUri = requestUri + '/api/Organisation/#id/get_extented_accounts/';
 
        var userUri = requestUri + '/api/Organisation/?id=#id&method=get_extented_accounts';
        var orgUri = requestUri + '/api/Organisation/?method=get_tops';
        var rdsUri = requestUri + '/api/RDS/'; 
        var roleUri = requestUri + '/api/Role/'; 
        var organisations = [], users = {}, rdses = [], roles = [];
        
        function _getUsersOf(orgId) {
            var deferred = $q.defer();
            if (orgId in users) {
                deferred.resolve(users[orgId]);
            } else { 
                $http.get(userUri.replace("#id", orgId)).then(function(response) {
                    users[orgId] = response.data;       
                    
                    var userList = _.values(users[orgId]);
                    _.forEach(userList, function(user) {  
                        _.forEach(organisations, function(org) {  
                            if (org.pk == user.billing) { 
                                org.billing = user.billing;  
                            }
                        });
                    });
                                                       
                    deferred.resolve(users[orgId]);  
                    deferred.resolve(organisations);     
                });
            }
            return deferred.promise;
        }
        return {
            getOrganisations: function() {
                var deferred = $q.defer();
                if (organisations.length) {
                    deferred.resolve(organisations);
                } else {
                    $http.get(orgUri).then(function(response) { 
                        organisations = response.data;  
                        deferred.resolve(organisations); 
                        for (var i = 0 ; i < organisations.length; i++) {
                           _getUsersOf(organisations[i].pk);
                        }  
                    });
                }
                return deferred.promise;
            }, 
            getAllUsers: function() {
                var deferred = $q.defer();
                deferred.resolve(users);
                return deferred.promise;
            },
            getBillings: function() {
                var deferred = $q.defer();
                deferred.resolve(organisations);
                return deferred.promise;
            },
            getRdses: function() {
                var deferred = $q.defer();
                if (rdses.length) {
                    deferred.resolve(rdses);
                } else {
                    $http.get(rdsUri).then(function(response) { 
                        rdses = response.data;  
                        deferred.resolve(rdses);  
                    });
                }
                return deferred.promise;
            },
            getRoles: function() {
                var deferred = $q.defer();
                if (roles.length) {
                    deferred.resolve(roles);
                } else {
                    $http.get(roleUri).then(function(response) { 
                        roles = response.data;  
                        deferred.resolve(roles);  
                    });
                }
                return deferred.promise;
            }
        };
    }); 

    app.factory("queryResource", ["$resource", function($resource) {
      return {
        build: function(url) {
          //return $resource(url + '/:object', {count:3},
          return $resource(url + '/:object', {}, {
            'get': {
              method: 'GET',
              headers: {
                "x-ersa-auth-token": sessionStorage["secret"]
              }
            },
            'getNoHeader': {
              method: 'GET' 
            },
            'query': {
              method: 'GET',
              isArray: true,
              headers: {
                "x-ersa-auth-token": sessionStorage["secret"]
              }
            },
            'queryNoHeader': {
              method: 'GET',
              isArray: true 
            },
            'post': {
              method: 'POST',
              isArray: true,
              headers: {
                "x-ersa-auth-token": sessionStorage["secret"],
                "Content-Type": "application/x-www-form-urlencoded",
                "Access-Control-Request-Method": "POST"
              }
            }
          });
        }
      };
    }]).factory("spinner", ["usSpinnerService", function(usSpinnerService) {
      return {
        start: function() {
          usSpinnerService.spin("main-spinner");
        },
        stop: function() {
          usSpinnerService.stop("main-spinner");
        }
      };
    }]);

    return app;
});
