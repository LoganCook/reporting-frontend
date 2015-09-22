var menuData = require("./menu-data");
var lz = require("lz-string");
var sjcl = require("sjcl");

module.exports = function($scope, $http, $localStorage, $sessionStorage) {
    $scope.$storage = $localStorage;

    $scope.configPassword = "";
    $scope.configString = "";

    $scope.cleanSlate = function() {
        $scope.$storage.endpoints = {};

        for (var menu in menuData) {
            for (var item in menuData[menu]) {
                var details = menuData[menu][item];

                var name = details[1];
                var service = details[0].slice(1);

                $scope.$storage.endpoints[name] = {
                    "name": name,
                    "service": service,
                    "endpoint": null,
                    "token": null
                };
            }
        }
    };

    $scope.validPassphrase = function() {
        return (($scope.configPassword !== "") && ($scope.configPassword.length >= 16));
    };

    $scope.updateConfigString = function() {
        if ($scope.validPassphrase()) {
            $scope.configString = btoa(sjcl.encrypt($scope.configPassword, lz.compressToUTF16(JSON.stringify($scope.$storage.endpoints))));
        } else {
            $scope.configString = "(use passphrase length >= 16 characters)";
        }
    };

    $scope.useConfigString = function() {
        try {
            var decrypted = sjcl.decrypt($scope.configPassword, atob($scope.configString));
            if (decrypted) {
                $scope.$storage.endpoints = JSON.parse(lz.decompressFromUTF16(decrypted));
            }
        } catch (e) {}
    };

    if (!("endpoints" in $scope.$storage)) {
        $scope.cleanSlate();
    }

    $scope.updateConfigString();
};
