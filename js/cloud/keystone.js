var numeral = require("numeral");
var moment = require("moment");
var _ = require("lodash");

module.exports = function ($rootScope, $scope, $timeout, $localStorage, $sessionStorage, reporting) {
    // TODO: replace prehistoric sandbox code

    /*
    var config = { "headers": { "x-ersa-nectar-keystone-token": "foo" }};

    $scope.select = {
        ts: null
    };

    $scope.usage = [];

    $scope.sortType = "name";
    $scope.sortReverse  = false;

    $http.get("http://localhost:5035/snapshot", config).then(function(data) {
        var snapshots = data.data;

        $scope.snapshots = _.sortBy(snapshots, "ts").reverse();
    });

    $http.get("http://localhost:5035/tenant", config).then(function(data) {
        var tenants = [];

        data.data.forEach(function(tenant) {
            if (tenant.name.indexOf("pt-") == -1) {
                tenants.push(tenant);
            }
        });

        $scope.tenants = tenants;
    });

    $scope.selectSnapshot = function() {
        // $http.get("http://localhost:1234/membership?filter=filesystem.eq." + $scope.select.fs + "&filter=snapshot.eq." + $scope.select.ts, config).then(function(data) {
        //     $scope.usage = data.data;
        // });
    };
    */
};
