module.exports = function ($scope, $http, $localStorage, $sessionStorage) {
    // TODO: replace prehistoric sandbox code

    /*
    var config = { "headers": { "x-ersa-storage-xfs-token": "foo" }};

    $scope.select = {
        fs: null,
        ts: null
    };

    $scope.usage = [];

    $scope.sortType = "username";
    $scope.sortReverse  = true;

    $scope.cleanName = function(path) {
        return path.replace("/export/compellent/", "").replace("/", " → ");
    };

    $http.get("http://localhost:5034/filesystem", config).then(function(data) {
        var filesystems = data.data[0].filesystems;

        $scope.filesystems = _.sortBy(filesystems, "name");
    });

    $http.get("http://localhost:5034/snapshot", config).then(function(data) {
        var snapshots = data.data[0].snapshots;

        $scope.snapshots = _.sortBy(snapshots, "ts").reverse();
    });

    $scope.selectUsage = function() {
        if ($scope.select.fs && $scope.select.ts) {
            $http.get("http://localhost:5034/usage?filter=filesystem.eq." + $scope.select.fs + "&filter=snapshot.eq." + $scope.select.ts, config).then(function(data) {
                $scope.usage = data.data;
            });
        }
    };
    */
};
