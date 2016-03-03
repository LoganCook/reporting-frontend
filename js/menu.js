define(["app", "menu-data"], function (app, menuData) {
    app.controller("MenuController", ["$rootScope", "$scope", "$timeout",
         function ($rootScope, $scope, $timeout) {
            $scope.menus = menuData;

            $scope.init = function() {
                //$scope.configured = "secret" in sessionStorage;
                $scope.configured = true; //for debug
                if ($scope.configured) {
                    $scope.email = "debug.email"; //for debug. for production, turn it into variable
                    //$scope.email = sessionStorage.email;
                }
            };

            $scope.reset = function() {
                sessionStorage.clear();
                window.location.replace("/");
            };

            $scope.init();
    }]);
});
