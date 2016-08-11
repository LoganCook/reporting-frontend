define(["app", "lodash", "mathjs","../util"], function(app, _, math, util) {
    app.controller("XFSController", ["$rootScope", "$scope", "$timeout", "reporting", "spinner",
    function($rootScope, $scope, $timeout, reporting, spinner) {

        $scope.values = _.values;

        $scope.formatTimestamp = util.formatTimestamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.formatSize = util.formatSize;
        $scope.basename = util.basename; 

        $scope.alerts = []; 
        $scope.select = {
            host: null,
            crm: null,
            filesystem: null,
            snapshot: null
        };
 
        $scope.xfs = {};

        $scope.output = {
            usage: [],
            summed: []
        };

        var baseQuery = function() {
            return {
                count: 100000,
                page: 1
            };
        };

        var xfs = {};

        var initXFS = function() {
            spinner.start();
            reporting.xfsBase(function(svc, type, data) {
                xfs[type] = $scope.xfs[type] = util.keyArray(data);

                if (type == "snapshot") {
                    xfs.snapshotByTimestamp = $scope.xfs.snapshotByTimestamp = util.keyArray(data, "ts");
                }
                spinner.stop();
            });
        }; 

        var clear = function() {
            $scope.raw = [];
            $scope.output.usage = [];
            $scope.output.summed = [];

            $scope.status = "No data loaded.";
        };
 
        initXFS();

        clear();

        $scope.selectHost = function() {
            clear();

            $scope.select.filesystem = '';

            if ($scope.select.host) {
                ["filesystem", "snapshot"].forEach(function(type) {
                    $scope.xfs[type] = {};
                    for (var key in xfs[type]) {
                        if (xfs[type][key].host == $scope.select.host) {
                            $scope.xfs[type][key] = xfs[type][key];
                        }
                    }
                });
            }
        }; 

        var processUsageRange = function(svc, type, query, data) {
            if (data && data.length > 0) {
                Array.prototype.push.apply($scope.raw, data);

                $scope.status = "Loaded " + $scope.raw.length + " usage records.";

                var next = util.nextPage(query);

                reporting.xfsQuery("usage", next, processUsageRange);
            } else {
                $scope.status = "Usage records: " + $scope.raw.length + ". Snapshots: " + $scope.select.snapshots.length + ".";

                if ($scope.raw.length === 0) {
                    return;
                }

                var t1 = util.dayStart($scope.rangeStart);
                var t2 = util.dayEnd($scope.rangeEnd);

                var weights = util.durationWeight(t1, t2, $scope.select.timestamps);

                var summed = {};

                _.forEach($scope.raw, function(record) {
                    if (!(record.owner in summed)) {
                        console.log(record);
                        summed[record.owner] = {
                            username: $scope.xfs.owner[record.owner].name,
                            fullname: "",
                            organisation: "",
                            usage: 0,
                            peak: 0
                        };
                     }

                    record.usage *= 1024;

                    var userSum = summed[record.owner];

                    var snapshot = $scope.xfs.snapshot[record.snapshot];

                    var weightedUsage = weights[snapshot.ts] * record.usage;

                    userSum.usage += weightedUsage;

                    if (record.usage > userSum.peak) {
                        userSum.peak = record.usage;
                    }
                });

                spinner.stop();

                $scope.output.summed = _.values(summed).filter(function(entry) {
                    return entry.usage > 0;
                });
            }
        };
 
        $scope.load = function(rangeEpochFilter) { 
            $scope.alerts = [];
            if (!($scope.select.host)) {
                $scope.alerts.push({type: 'danger',msg: "Please select Host!"}); 
                return false;
            }          
 
            if (!($scope.select.filesystem)) {
                $scope.alerts.push({type: 'danger',msg: "Please select Fileysystem!"}); 
                return false;
            }                             
            
            var t1 = util.dayStart($scope.rangeStart);
            var t2 = util.dayEnd($scope.rangeEnd);

            var snapshots = _.filter(_.values($scope.xfs.snapshot), function(snapshot) {
                return (snapshot.ts >= t1) && (snapshot.ts < t2);
            });

            // Take a sample of snapshots to keep things manageable. Sort by UUID (which
            // is consistent and pseudorandom). 

            snapshots.sort(function(s1, s2) {
                if (s1.id > s2.id) {
                    return 1;
                } else if (s1.id < s2.id) {
                    return -1;
                } else {
                    return 0;
                }
            }); 

            var timestamps = snapshots.map(function(s) { return s.ts; });

            var earlierSnapshots = _.values($scope.xfs.snapshot).filter(function(s) {
                return s.ts < t1;
            });

            if (earlierSnapshots.length > 0) {
                earlierSnapshots = util.keyArray(earlierSnapshots, "ts");

                var ts = math.max(_.keys(earlierSnapshots).map(function(i) { return parseInt(i); }));

                snapshots.push(earlierSnapshots[ts]);
                timestamps.push(ts);
            }

            $scope.select.snapshots = snapshots;
            $scope.select.timestamps = math.sort(timestamps);

            if (snapshots.length === 0) {
                $scope.status = "No snapshots in that range.";
                return;
            }

            var query = baseQuery();
             
            if ($scope.select.filesystem == '' ) { 
                query.filter = [
                    "snapshot.in." + snapshots.map(function(s) { return s.id; }).join(",") 
                ];
            } else {
                query.filter = [
                    "snapshot.in." + snapshots.map(function(s) { return s.id; }).join(","),
                    "filesystem.eq." + $scope.select.filesystem 
                ]; 
            }
            

            clear();
            
            spinner.start();
            $scope.status = "Loading ...";
            $scope.jobCount = 0;

            reporting.xfsQuery("usage", query, processUsageRange);
        };
 
        $scope.export = function() {
            var data = [
                ["Full Name", "Organisation", "Username", "Usage (Weighted Mean, GB)", "Usage (Peak, GB)"]
            ];

            _.forEach($scope.output.summed, function(entry) {
                data.push([
                    entry.fullname,
                    entry.organisation,
                    entry.username,
                    entry.usage / (1024 * 1024 * 1024),
                    entry.peak / (1024 * 1024 * 1024)
                ]);
            });

            return data;
        };
         
        // Alert Util
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
    }]);   
});
