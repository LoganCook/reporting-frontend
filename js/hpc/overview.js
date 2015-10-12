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

    var baseFilters = [
        "count=5000",
        "page=1"
    ];

    var jobSummary = {};

    var clear = function() {
        $scope.status = "Zero jobs loaded.";
        $scope.jobs = [];
        $scope.jobCount = 0;
        $scope.jobSummary = {};
    };

    clear();

    reporting.hpcBase(function(svc, type, data) {
        $scope[type] = util.keyArray(data);
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

    var populateSummaryCRM = function(summary) {
        if (!(summary.username in $scope.crm.usernames)) {
            summary.fullname = "?";
            summary.organisation = "?";
        } else {
            var usernameID = $scope.crm.usernames[summary.username].id;

            var usernameFilters = [
                "filter=snapshot.eq." + $scope.crm.id,
                "filter=username.eq." + usernameID
            ];

            reporting.query("crm", "usernameMapping", usernameFilters, function(svc, type, query, data) {
                if (data) {
                    var personID = data[0].person;
                    var person = $scope.crm.people[personID];

                    if (person) {
                        summary.fullname = person.first_name + " " + person.last_name;
                    }

                    var membershipFilters = [
                        "filter=snapshot.eq." + $scope.crm.id,
                        "filter=person.eq." + personID
                    ];

                    reporting.query("crm", "membership", membershipFilters, function(svc, type, query, data) {
                        var orgNames = [];

                        _.forEach(data, function(entry) {
                            var orgID = entry.organisation;
                            var org = $scope.crm.organisations[orgID];
                            orgNames.push(org.name);
                        });

                        summary.organisation = orgNames.join(" / ");
                    });
                } else {
                    summary.fullname = "?";
                }
            });
        }
    };

    var nextPage = function(query) {
        var next = [];
        _.forEach(query, function(param) {
            if (_.startsWith(param, "page=")) {
                next.push("page=" + (parseInt(param.split("=")[1]) + 1));
            } else {
                next.push(param);
            }
        });
        return next;
    };

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

                populateSummaryCRM(jobSummary[job.owner]);
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
            $scope.status = "Loading ... " + $scope.jobCount + " jobs.";

            updateSummary(data);
            publishJobSummary();

            var next = nextPage(query);

            reporting.hpcQuery("job", next, processJobs);
        } else {
            $scope.status = "Jobs: " + $scope.jobCount;
        }
    };

    $scope.loadJobs = function() {
        $scope.rangeStartEpoch = Math.round(util.chopTime($scope.rangeStart).getTime() / 1000);
        $scope.rangeEndEpoch = Math.round(util.chopTime($scope.rangeEnd).getTime() / 1000);

        var query = baseFilters.slice();
        query.push("filter=end.ge." + $scope.rangeStartEpoch);
        query.push("filter=end.lt." + $scope.rangeEndEpoch);

        clear();

        $scope.status = "Loading ...";

        reporting.hpcQuery("job", query, processJobs);
    };
};
