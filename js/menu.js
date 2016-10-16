define(["app", "menu-data"], function (app, menuData) {
    app.controller("MenuController", ["$rootScope", "$scope", "AuthService",
         function ($rootScope, $scope, AuthService) {  
            
            $scope.isArray = angular.isArray;
            
            // FIXME: menu and route both use menuData, can it be mananged together?
            if (AuthService.isAdmin()) { 
                $scope.menus = menuData.ersa;
            } else {
                $scope.menus = menuData.portal;   
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
