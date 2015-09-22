var menuData = require("./menu-data");

module.exports = function ($scope, $http, $localStorage, $sessionStorage) {
    $scope.menus = menuData;
};
