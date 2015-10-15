var _ = require("lodash");
var util = require("../util");

module.exports = function ($rootScope, $scope, $timeout, $localStorage, $sessionStorage, reporting) {
    $scope.values = _.values;

    $scope.formatTimestamp = util.formatTimestamp;
    $scope.formatNumber = util.formatNumber;
    $scope.formatDuration = util.formatDuration;
    $scope.formatSize = util.formatSize;
    $scope.basename = util.basename;

    $scope.select = {
        crm: null,
        filesystem: null,
        snapshot: null
    };

    $scope.crm = {};
    $scope.xfs = {};

    $scope.output = {
        usage: []
    };

    reporting.crmBase(function(svc, type, data) {
        if (type == "usernames") {
            $scope.crm[type] = util.keyArray(data, "username");
        } else {
            $scope.crm[type] = util.keyArray(data);
        }
    });

    reporting.xfsBase(function(svc, type, data) {
        $scope.xfs[type] = util.keyArray(data);
    });

    var clear = function() {
        $scope.status = "No data loaded.";
    };

    clear();

    var processUsage = function(svc, type, query, data) {
        if (data && data.length > 0) {
            $scope.status = "Loaded " + data.length + " usage records.";

            $scope.output.usage = [];

            data.forEach(function(entry) {
                if (entry.usage === 0) {
                    return;
                }

                entry.username = "?";

                if (entry.owner in $scope.xfs.owner) {
                    ["soft", "hard", "usage"].forEach(function(key) {
                        entry[key] *= 1024;
                    });

                    entry.username = $scope.xfs.owner[entry.owner].name;
                    entry.fullname = "";
                    entry.organisation = "";

                    reporting.populateFromUsername($scope.select.crm, entry);
                }

                $scope.output.usage.push(entry);
            });
        }
    };

    $scope.loadUsage = function() {
        var query = [
            "filter=snapshot.eq." + $scope.select.snapshot,
            "filter=filesystem.eq." + $scope.select.filesystem
        ];

        clear();

        $scope.status = "Loading ...";

        reporting.xfsQuery("usage", query, processUsage);
    };

    $scope.exportUsage = function() {
        data = [
            ["Full Name", "Organisation", "Username", "Usage (GB)", "Soft Quota (GB)", "Hard Quota (GB)"]
        ];

        _.forEach($scope.output.usage, function(entry) {
            data.push([
                entry.fullname,
                entry.organisation,
                entry.username,
                entry.usage / (1024 * 1024 * 1024),
                entry.soft / (1024 * 1024 * 1024),
                entry.hard / (1024 * 1024 * 1024)
            ]);
        });

        return data;
    };

};
