define(["app", "menu-data"], function (app, menuData) {
    app.controller("MenuController", ["$rootScope", "$scope",
         function ($rootScope, $scope) {  
            
            $scope.isArray = angular.isArray;
            
            sessionStorage['ersaUser'] = 'false'; 
            
            if(sessionStorage['ersaUser'] === 'true'){ 
                $scope.menus = menuData.ersa;
            }else{
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
