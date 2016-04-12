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
      'qs': '/node_modules/qs/dist/qs'
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
    var app = angular.module("reportingApp", ["ngSanitize", "ui.router", "ui.bootstrap", "ngResource", "ngCsv", "angularSpinner"]);
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



require(["app", "menu", "identity/crm", "hpc/hpc"],
    function (app) {
        require(["route"], function(route) {
            app.config(["$stateProvider", "$urlRouterProvider", route]);
            angular.bootstrap(document, ["reportingApp"]);
        });
    }
);
