require.config({
  //enforceDefine: true, //This is for IE error handling: http://requirejs.org/docs/api.html#ieloadfail. use define instead of a normal js file
  paths: {
      'ng-csv' : '/lib/ng-csv/build/ng-csv.min',
      'axios' : '/lib/axios/dist/axios.min',
      'lodash': '/lib/lodash/lodash.min',
      'filesize': '/lib/filesize/lib/filesize.min',
      "mathjs": '/lib/mathjs/dist/math.min',
      "moment": '/lib/moment/min/moment.min',
      "numeral": '/lib/numeral/min/numeral.min',
      "loadingSpinner": '/lib/angular-spinner/angular-spinner.min',
      'qs': '/node_modules/qs/dist/qs',
      'ngGoogleChart': '/lib/angular-google-chart/ng-google-chart.min.js'
  },
  shim: {
      "ng-csv": { exports: "ng-csv" }
  },
  baseUrl: '/js'
});

//TODO: May have seperated dev and production main.js files or gulp it?
require(["debug-settings"], function(d) {
    for (var attr in d) {
        if (d.hasOwnProperty(attr)) sessionStorage[attr] = d[attr];
        }
    }, function (err) {
        console.log("Cannot load settings, skip set up debug session.");
});

define("app", ["client", "ng-csv"], function(client) {
    var app = angular.module("reportingApp", ["ngSanitize", "ui.router", "ui.bootstrap", "ngResource", "ngCsv", "angularSpinner", "googlechart"]);
    app.factory("reporting", ["$timeout", client]);
    app.config(['$resourceProvider', function($resourceProvider) {
      // Don't strip trailing slashes from calculated URLs to make Django URLs work
      $resourceProvider.defaults.stripTrailingSlashes = false;
    }]);

    //Global loading modal popup for all pages
    app.directive('usSpinner',   ['$rootScope' ,function ($rootScope){
        return {
            link: function (scope, elm, attrs){  
                $rootScope.spinnerActive = false;
                scope.isLoading = function () { 
                    return $rootScope.spinnerActive;
                };

                scope.$watch(scope.isLoading, function (loading){
                    $rootScope.spinnerActive = loading;
                    if(loading){ 
                        elm.removeClass('ng-hide');
                    }else{ 
                        elm.addClass('ng-hide');
                    }
                }); 
            }
        }; 
    }]);
 

    //Global search form for all pages
    app.directive('ersaSearch',  function (){
        return {                          
            restrict: "AE",   
            controller: function ($scope, $element, $attrs, $transclude) {
 
                $scope.dateOptions = {
                    //dateDisabled: true, 
                    maxDate: new Date() 
                };
                             
                /**
                 * Initialize start and end data.
                 * Each controller can still set up start and end date.
                 */
                if(!angular.isDefined($scope.load)){   
                    alert('load function is not defined ..');
                }
                if(!angular.isDefined($scope.export)){   
                    alert('export function is not defined ..');
                }
                
                if(!angular.isDefined($scope.rangeStart)){    
                    var startDate = new Date();
                    startDate.setMonth(startDate.getMonth() -1);
                    $scope.rangeStart = startDate;
                }
                  
                if(!angular.isDefined($scope.rangeEnd)){   
                    $scope.rangeEnd = new Date();
                }
                
                if(!angular.isDefined($scope.openRangeStart)){  
                    $scope.rangeStartOpen = false;
                    $scope.openRangeStart = function() {
                        $scope.rangeStartOpen = true;
                    };
                } 
                
                if(!angular.isDefined($scope.openRangeEnd)){   
                    $scope.rangeEndOpen = false;
                    $scope.openRangeEnd = function() {
                        $scope.rangeEndOpen = true;
                    }; 
                }
                
                
                /**
                 * If each class is defined , assigne to 
                 */
                if(angular.isDefined($attrs.startDateClass)){ 
                    $scope.startDateClassName = $attrs.startDateClass; 
                }
                if(angular.isDefined($attrs.endDateClass)){ 
                    $scope.endDateClassName = $attrs.endDateClass; 
                }
                if(angular.isDefined($attrs.buttonClass)){ 
                    $scope.buttonClassName = $attrs.buttonClass; 
                }
                

                /**
                 * start Util fuctions 
                 */
                getSearchDateFilter = function(scope) {
                    
                    if (scope.rangeStart > scope.rangeEnd) {
                        scope.alerts.push({type: 'danger',msg: "Start date invalid"}); 
                        return '';
                    }          
                    
                    var rangeStartEpoch = this.dayStart(scope.rangeStart);
                    var rangeEndEpoch = this.dayEnd(scope.rangeEnd);
                    
                    var filter =  {
                            filter: [
                                "end.ge." + rangeStartEpoch,
                                "end.lt." + rangeEndEpoch
                            ]
                        }; 
                    return filter;
                }

                dayStart = function(ts) {
                    var modified = new Date(ts);

                    modified.setHours(0);
                    modified.setMinutes(0);
                    modified.setSeconds(0);
                    modified.setMilliseconds(0);

                    return Math.round(modified.getTime() / 1000);
                }

                dayEnd = function(ts) {
                    var modified = new Date(ts);

                    modified.setHours(23);
                    modified.setMinutes(59);
                    modified.setSeconds(59);
                    modified.setMilliseconds(999);

                    return Math.round(modified.getTime() / 1000);
                }
                
                /**
                 * end Util fuctions 
                 */
                
                /** 
                 * Wrapping functions
                 */
                $scope._load = function() {
                    console.log("called _load..");
                    var rangeEpochFilter = getSearchDateFilter($scope);
                    if(rangeEpochFilter == ''){
                        return;
                    } 
            
                    $scope.load(rangeEpochFilter);
                } 
                
                $scope._export = function() {  
                    return $scope.export();
                }
            },   
            templateUrl: 'template/directives/ersa-search.html'
        }; 
    });
     

    //Cacheable organisation-user data for all pages
    app.factory('org', function($http, $q) {
        var requestUri = 'http://localhost:8000';
        var userUri = requestUri + '/api/Organisation/?id=#id&method=get_extented_accounts';
        var orgUri = requestUri + '/api/Organisation/?method=get_tops';
        var organisations = [], users = {};
        
        function _getUsersOf(orgId) {
            var deferred = $q.defer();
            if (orgId in users) {
                deferred.resolve(users[orgId]);
            } else { 
                $http.get(userUri.replace("#id", orgId)).then(function(response) {
                    users[orgId] = response.data;
                    deferred.resolve(users[orgId]);
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
                        for(var i = 0 ; i < organisations.length; i++){  
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
            } 
        }
    }); 

    return app;
});



require(["app", "menu", "identity/crm", "hpc/hpc", "storage/xfs"],
    function (app) {
        require(["route"], function(route) {
            app.config(["$stateProvider", "$urlRouterProvider", route]);
            angular.bootstrap(document, ["reportingApp"]);
        });
    }
);
