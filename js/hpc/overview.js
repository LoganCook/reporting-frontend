var _ = require("lodash");
var util = require("../util");

module.exports = function($rootScope, $scope, $http, $localStorage, $sessionStorage, reporting) {
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

    var baseFilters = [
        "count=25000",
        "page=1"
    ];

    var jobSummary = {};

    var clear = function() {
        jobSummary = {};

        $scope.status = "Zero jobs loaded.";
        $scope.jobs = [];
        $scope.jobCount = 0;
        $scope.jobSummary = {};
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
        snapshots: {},
        snapshot: {
            "membership": [],
            "addressMapping": [],
            "usernameMapping": []
        }
    };

    reporting.crmBase(function(svc, type, data) {
        if (type == "usernames") {
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

                reporting.populateFromUsername($scope.crm.id, jobSummary[job.owner]);
            }

            jobSummary[job.owner].jobCount++;
            jobSummary[job.owner].cpuSeconds += job.cpu_seconds;
        });
    };

    var publishJobSummary = function() {
        $scope.jobSummary = _.values(jobSummary);
    };

    $scope.exportSummary = function() {
        data = [
            ["Full Name", "Organisation", "Username", "Job Count", "Core Hours"]
        ];

        _.forEach(jobSummary, function(summary) {
            data.push([
                summary.fullname,
                summary.organisation,
                summary.username,
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

        var query = baseFilters.slice();
        query.push("filter=start.ge." + $scope.rangeStartEpoch);
        query.push("filter=start.lt." + $scope.rangeEndEpoch);

        var queueQuery = [];

        for (var qID in $scope.selectedQueues) {
            if ($scope.selectedQueues[qID]) {
                queueQuery.push(qID);
            }
        }

        query.push("filter=queue.in." + queueQuery.join(","));

        clear();

        $scope.status = "Loading ...";

        reporting.hpcQuery("job", query, processJobs);
    };
};
