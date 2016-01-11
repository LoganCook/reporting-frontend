var _ = require("lodash");

var util = require("../util");

module.exports = function ($rootScope, $scope, $timeout, reporting) {
    // TODO: replace prehistoric sandbox code

    /*
    var config = { "headers": {
        "x-ersa-nectar-cinder-token": "foo",
        "x-ersa-nectar-keystone-token": "foo"
    }};

    $scope.select = {
        ts: null
    };

    $scope.volumeStatus = [];

    $scope.sortType = "name";
    $scope.sortReverse  = false;

    $http.get("http://localhost:5036/volume", config).then(function(data) {
        var volumes = data.data;
    });

    $http.get("http://localhost:5036/snapshot", config).then(function(data) {
        var snapshots = data.data;

        $scope.snapshots = _.sortBy(snapshots, "ts").reverse();
    });

    $http.get("http://localhost:5035/account", config).then(function(data) {
        var accounts = [];

        $scope.accountByOpenStackID = {};

        data.data.forEach(function(account) {
            accounts.push(account);

            $scope.accountByOpenStackID[account.openstack_id] = account;
        });

        $scope.accounts = accounts;
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

    $scope.getOwnerID = function(openstackID) {
        var owner = $scope.accountByOpenStackID[openstackID];
        if (owner) {
            return owner.id;
        } else {
            return null;
        }
    };

    $scope.selectSnapshot = function() {
        $http.get("http://localhost:5036/volume/state?filter=snapshot.eq." + $scope.select.ts, config).then(function(data) {
            var volumeStatus = data.data;

            var ownerIDs = [];

            volumeStatus.forEach(function(vs) {
                var ownerID = $scope.getOwnerID(vs.volume.owner);

                ownerIDs.push(ownerID);
            });

            var ownerQuery = _.unique(_.compact(ownerIDs)).join(",");

            $http.get("http://localhost:5035/mapping?filter=snapshot.eq.e4df8df3-1a5a-4e41-bab0-9304c3cb2072&filter=account.in." + ownerQuery, config).then(function(data) {
                volumeStatus.forEach(function(vs) {
                    vs.name = _.trim(vs.name);

                    if (vs.name === "") {
                        vs.name = "—";
                    }

                    vs.tenantName = $scope.getTenantName(vs.volume.tenant);

                    var ownerNameByOpenStackID = {};

                    data.data.forEach(function(mapping) {
                        ownerNameByOpenStackID[mapping.account.openstack_id] = mapping;
                    });

                    var owner = ownerNameByOpenStackID[vs.volume.owner];

                    if (owner) {
                        vs.ownerName = owner.reference.value;
                    } else {
                        vs.ownerName = "?";
                    }
                });

                $scope.volumeStatus = volumeStatus;
            });
        });
    };
    */
};
