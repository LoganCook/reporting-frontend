define(["app", "lodash", "../util"], function(app, _, util) {
    app.controller("HPCController", ["$rootScope", "$scope", "$resource", "$timeout", "reporting", function($rootScope, $scope, $resource, $timeout, reporting) {
        $scope.values = _.values;

        $scope.formatTimestamp = util.formatTimestamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;

        $scope.rangeStart = new Date();
        $scope.rangeStartOpen = false;
        $scope.openRangeStart = function() {
            $scope.rangeStartOpen = true;
        };

        $scope.rangeEnd = new Date();
        $scope.rangeEndOpen = false;
        $scope.openRangeEnd = function() {
            $scope.rangeEndOpen = true;
        };

        $scope.selectedQueues = {};

        var baseFilters = function() {
            return {
                count: 25000,
                page: 1
            };
        };

        var jobSummary = {};

        var clear = function() {
            jobSummary = {};

            $scope.status = "Zero jobs loaded.";
            $scope.jobs = [];
            $scope.jobCount = 0;
            $scope.jobSummary = [];
        };

        clear();

        reporting.hpcBase(function(svc, type, data) {
            $scope[type] = util.keyArray(data);

            if (type == "queue") {
                _.forEach($scope.selectedQueues, function(q) {
                    $scope.selectedQueues[q.id] = false;
                });
            }
        });

        $scope.crm = {
            id: null,
            snapshots: [],
            snapshot: {
                "membership": [],
                "addressMapping": [],
                "usernameMapping": []
            }
        };

        function mapUser(attachTo) {
            var found = false;
            if (angular.isDefined($scope.details)) {
                var fields = ['fullname', 'email', 'organisation'], i;
                if (attachTo.username in $scope.details) {
                    found = true;
                    for(i = 0; i < 3; i++) {
                        attachTo[fields[i]] = $scope.details[attachTo.username][fields[i]] ;
                    }
                }
            } else {
                $scope.error = "Data need to be loaded";
            }
            return found;
        }

        //Here it loads crm data into $scope.crm["snapshot", "person", "organisation", "username", "email"]
        //username is packed differently
        reporting.crmBase(function(svc, type, data) {
            if (type == "username") {
                $scope.crm[type] = util.keyArray(data, "username");
            } else {
                $scope.crm[type] = util.keyArray(data);
            }
        });

        var selectCRM = function() {};

        var updateSummary = function(data) {
            _.forEach(data, function(job) {
                if (!(job.owner in jobSummary)) {
                    jobSummary[job.owner] = {
                        owner: job.owner,
                        username: $scope.owner[job.owner].name,
                        fullname: "",
                        organisation: "",
                        jobCount: 0,
                        cpuSeconds: 0
                    };

                    //reporting.populateFromUsername($scope.crm.id, jobSummary[job.owner]);
                }

                jobSummary[job.owner].jobCount++;
                jobSummary[job.owner].cpuSeconds += job.cpu_seconds;

            });
            var username, swap = {};
            for (username in jobSummary) {
                if (mapUser(jobSummary[username])) {
                    swap[username] = jobSummary[username];
                };
            }
            jobSummary = swap;
        };

        var publishJobSummary = function() {
            $scope.jobSummary = _.values(jobSummary);
        };

        $scope.exportSummary = function() {
            data = [
                ["Full Name", "Organisation", "Username", "Email", "Job Count", "Core Hours"]
            ];

            _.forEach(jobSummary, function(summary) {
                data.push([
                    summary.fullname,
                    summary.organisation,
                    summary.username,
                    summary.email,
                    summary.jobCount, (summary.cpuSeconds / 3600).toFixed(1)
                ]);
            });

            return data;
        };

        var processJobs = function(svc, type, query, data) {
            if (data && data.length > 0) {
                Array.prototype.push.apply($scope.jobs, data);
                $scope.jobCount += data.length;
                $scope.status = "Loaded " + $scope.jobCount + " jobs.";

                updateSummary(data);
                publishJobSummary();

                var next = util.nextPage(query);

                reporting.hpcQuery("job", next, processJobs);
            } else {
                $scope.status = "Jobs: " + $scope.jobCount;
            }
        };

        $scope.loadJobs = function() {
            $scope.rangeStartEpoch = util.dayStart($scope.rangeStart);
            $scope.rangeEndEpoch = util.dayEnd($scope.rangeEnd);

            var query = _.merge(baseFilters(), {
                filter: [
                    "start.ge." + $scope.rangeStartEpoch,
                    "start.lt." + $scope.rangeEndEpoch
                ]
            });

            var queueQuery = [];

            for (var qID in $scope.selectedQueues) {
                if ($scope.selectedQueues[qID]) {
                    queueQuery.push(qID);
                }
            }

            query.filter.push("queue.in." + queueQuery.join(","));

            clear();

            $scope.status = "Loading ...";

            reporting.hpcQuery("job", query, processJobs);
        };

        var localr = $resource('http://127.0.01:8000/api/:target/');
        localr.query({target:'Organisation', method:'get_tops'}, function(data) {
            $scope.topOrgs = data;
        });

        $scope.orgChanged = function() {
            $scope.error = "";
            if ($scope.selectedOrg !=='') {
                var localr = $resource('http://127.0.01:8000/api/:target/');
                localr.get({target:'Organisation', id:$scope.selectedOrg, method:'get_extented_accounts'}, function(data) {
                    $scope.details = data;
                });
            }
        }

    }]);
});
