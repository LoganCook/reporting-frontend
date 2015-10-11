var numeral = require("numeral");
var moment = require("moment");
var _ = require("lodash");

module.exports = function ($rootScope, $scope, $timeout, $localStorage, $sessionStorage, reporting) {
    // TODO: replace prehistoric sandbox code

    /*
    var config = { "headers": {
        "x-ersa-nectar-swift-token": "foo",
        "x-ersa-nectar-keystone-token": "foo"
    }};

    $scope.select = {
        ts: null
    };

    $scope.usage = [];

    $scope.sortType = "name";
    $scope.sortReverse  = false;

    $http.get("http://localhost:5037/snapshot", config).then(function(data) {
        var snapshots = data.data;

        $scope.snapshots = _.sortBy(snapshots, "ts").reverse();
    });

    $http.get("http://localhost:5035/tenant", config).then(function(data) {
        var tenants = [];

        $scope.tenantByOpenStackID = {};

        data.data.forEach(function(tenant) {
            tenants.push(tenant);

            $scope.tenantByOpenStackID[tenant.openstack_id] = tenant;
        });

        $scope.tenants = tenants;
    });

    $scope.getTenantName = function(openstackID) {
        var tenant = $scope.tenantByOpenStackID[openstackID];
        if (tenant) {
            return tenant.name;
        } else {
            return "?";
        }
    };

    $scope.selectSnapshot = function() {
        $http.get("http://localhost:5037/usage?filter=objects.gt.0&filter=snapshot.eq." + $scope.select.ts, config).then(function(data) {
            var usage = [];

            data.data.forEach(function(raw) {
                tenantUsage = {};

                tenantName = $scope.getTenantName(raw.account.openstack_id);

                if (tenantName) {
                    tenantUsage.name = tenantName;
                } else {
                    tenantUsage.name = "?";
                }

                tenantUsage.containers = raw.containers;
                tenantUsage.bytes = raw.bytes;

                if (raw.quota) {
                    tenantUsage.quota = raw.quota;
                } else {
                    tenantUsage.quota = 0;
                }

                usage.push(tenantUsage);
            });

            $scope.usage = usage;
        });
    };
    */
};
