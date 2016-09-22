define(["app", "menu-data"], function (app, menuData) {
    app.controller("MenuController", ["$rootScope", "$scope",
         function ($rootScope, $scope) {  
            
            $scope.isArray = angular.isArray;
            
            sessionStorage['ersaUser'] = true;
            
            if(sessionStorage['ersaUser']){ 
                $scope.menus = menuData.ersa;
            }else{
                $scope.menus = menuData.portal;   
            }
            $scope.menus = menuData.ersa;
            
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
