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

    var initKeystone = function() {
        reporting.keystoneBase(function(svc, type, data) {
            if (type == "snapshot") {
                keystone.snapshotByTimestamp = $scope.keystone.snapshotByTimestamp = util.keyArray(data, "ts");
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
                    $scope.referenceByDomain[domain] = referenceByDomain[domain].join(", ");
                }
            }

            keystone[type] = $scope.keystone[type] = util.keyArray(data);
        });
    };

    initKeystone();

    var processSnapshot = function(svc, type, query, data) {
        if (data && data.length > 0) {
            keystone[type] = $scope.keystone[type] = util.keyArray(data);
        }
    };

    $scope.selectSnapshot = function() {
        if ($scope.select.snapshot) {
            $scope.keystone.mapping = $scope.keystone.membership = {};
            
            var query = baseFilters.slice();
            query.push("filter=snapshot.eq." + $scope.select.snapshot);

            ["mapping", "membership"].forEach(function(type) {
                reporting.keystoneQuery(type, query, processSnapshot);
            });
        }
    };
};
