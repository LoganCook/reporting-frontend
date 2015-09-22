var moment = require("moment");
var _ = require("lodash");

module.exports = function ($scope, $http, $localStorage, $sessionStorage) {
    // TODO: replace prehistoric sandbox code

    /*
    var config = { "headers": { "x-ersa-hpc-token": "foo" }};

    $scope.select = {
        radioModel: null
    };

    $scope.jobs = [];

    $scope.sortType = "start";
    $scope.sortReverse  = true;

    $scope.formatHostList = function(job) {
        var hosts = [];

        for (var i in job.hosts) {
            hosts.push(job.hosts[i].name);
        }

        return hosts.join(", ");
    };

    $http.get("http://localhost:5032/queue", config).then(function(data) {
        $scope.queues = data.data;
        $scope.queueValues = _.values(data.data);

        var queueByName = {};

        for (var i in data.data) {
            var queue = data.data[i];

            queueByName[queue.name] = queue.id;
        }

        $scope.queueByName = queueByName;
    });

    $scope.toggleQueue = function() {
        $http.get("http://localhost:5032/job?filter=queue.eq." + $scope.queueByName[$scope.select.radioModel], config).then(function(data) {
            $scope.jobs = data.data;
        });
    };
    */
};
