var _ = require("lodash");
var util = require("../util");

module.exports = function ($rootScope, $scope, $timeout, $localStorage, $sessionStorage, reporting) {
    $scope.values = _.values;

    $scope.formatTimestamp = util.formatTimestamp;
    $scope.formatNumber = util.formatNumber;

    var baseFilters = [
        "count=50000",
        "page=1"
    ];

    $scope.select = {
        snapshot: null
    };

    var keystone = {};

    $scope.keystone = {};

    $scope.referenceByDomain = {};

    var isKnownTenant = function(t) { return t in $scope.keystone.tenant; };

    var clear = function() {
        $scope.membershipByAccount = {};
        $scope.membershipByTenant = {};

        $scope.referenceByAccount = {};

        $scope.addressesByTenant = {};
    };

    var initKeystone = function() {
        reporting.keystoneBase(function(svc, type, data) {
            if (type == "snapshot") {
                $scope.snapshotByTimestamp = util.keyArray(data, "ts");
            } else if (type == "tenant") {
                // Strip personal tenants.

                var trimmed = [];

                _.forEach(data, function(tenant) {
                    if (!tenant.name.startsWith("pt-")) {
                        trimmed.push(tenant);
                    }
                });

                data = trimmed;
            } else if (type == "reference") {
                var referenceByDomain = {};

                _.forEach(data, function(reference) {
                    if (!(reference.domain in referenceByDomain)) {
                        referenceByDomain[reference.domain] = [];
                    }

                    var address = reference.value.split("@")[0].toLowerCase();

                    referenceByDomain[reference.domain].push(address);
                });

                for (var domain in referenceByDomain) {
                    referenceByDomain[domain].sort();
                }

                $scope.referenceByDomain = referenceByDomain;
            }

            keystone[type] = $scope.keystone[type] = util.keyArray(data);
        });
    };

    clear();

    initKeystone();

    var processSnapshot = function(svc, type, query, data) {
        if (data && data.length > 0) {
            keystone[type] = $scope.keystone[type] = util.keyArray(data);

            if (type == "membership") {
                // account → [membership]
                var membershipByAccount = util.keyMultiArray(data, "account");

                for (var account in membershipByAccount) {
                    membershipByAccount[account] = membershipByAccount[account].filter(isKnownTenant);
                }

                $scope.membershipByAccount = membershipByAccount;

                // tenant → [membership]
                var membershipByTenant = util.keyMultiArray(data, "tenant");

                _.forEach(membershipByTenant, function(value, tenant) {
                    if (isKnownTenant(tenant)) {
                        $scope.membershipByTenant[tenant] = value;
                    }
                });
            } else if (type == "mapping") {
                $scope.referenceByAccount = util.keyArray(data, "account");
            }
        }

        if (!(_.isEmpty($scope.membershipByTenant) || _.isEmpty($scope.referenceByAccount))) {
            _.forEach($scope.membershipByTenant, function(members, tenant) {
                $scope.addressesByTenant[tenant] = members.map(function(member) {
                    var mapping = $scope.referenceByAccount[member.account];
                    return mapping ? $scope.keystone.reference[mapping.reference].value : "?";
                }).sort();
            });
        }
    };

    $scope.selectSnapshot = function() {
        if ($scope.select.snapshot) {
            $scope.keystone.mapping = $scope.keystone.membership = {};

            clear();

            var query = baseFilters.slice();
            query.push("filter=snapshot.eq." + $scope.select.snapshot);

            ["mapping", "membership"].forEach(function(type) {
                reporting.keystoneQuery(type, query, processSnapshot);
            });
        }
    };
};
