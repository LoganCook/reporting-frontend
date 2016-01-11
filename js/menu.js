var menuData = require("./menu-data");

module.exports = function ($rootScope, $scope, $timeout, reporting) {
    $scope.menus = menuData;

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
};
