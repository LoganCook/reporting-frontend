define(["app", "menu-data"], function (app, menuData) {
    app.controller("MenuController", ["$rootScope", "$scope",
         function ($rootScope, $scope) {  
            
            $scope.isArray = angular.isArray;
            
            var ersaUser = false; 
             
            $scope.menus = menuData.ersa;
            //$scope.menus = menuData.portal;  
            
            if(ersaUser === true){ 
                $scope.menus = menuData.ersa;
                sessionStorage['ersaUser'] = true; 
            }
            
            $scope.init = function() {
                $scope.configured = "secret" in sessionStorage;
                if ($scope.configured) {
                    $scope.email = sessionStorage.email;
                }
            };

            $scope.reset = function() {
                sessionStorage.clear();
                window.location.replace("/");
            };

            $scope.init();
    }]);
});
