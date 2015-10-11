var menuData = require("./menu-data");

module.exports = function ($rootScope, $scope, $timeout, $localStorage, $sessionStorage, reporting) {
    $scope.menus = menuData;
};
