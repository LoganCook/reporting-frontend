define(["app", "lodash", "mathjs","../util"], function(app, _, math, util) {
    app.controller("FilesystemController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
 
    
    // TODO: replace prehistoric sandbox code

    /*
    var config = { "headers": { "x-ersa-storage-filesystem-token": "foo" }};

    $scope.select = {
        fs: null,
        ts: null
    };

    $scope.snapshots = [];

    $scope.sortType = "ts";
    $scope.sortReverse  = true;

    $scope.cleanName = function(path) {
        return path.replace("/home/data/", "").replace("/", " → ");
    };

    $http.get("http://localhost:5033/filesystem", config).then(function(data) {
        var filesystems = data.data[0].filesystems;

        $scope.filesystems = _.sortBy(filesystems, "name");
    });

    $http.get("http://localhost:5033/snapshot", config).then(function(data) {
        var filesystems = data.data[0].filesystems;

        var snapshots = {};

        filesystems.forEach(function(fs) {
            snapshots[fs.id] = fs.snapshots;
        });

        $scope.allSnapshots = snapshots;
    });

    $scope.selectFilesystem = function() {
        $scope.snapshots = $scope.allSnapshots[$scope.select.fs];
    };
    */
         
    }]);   
});
