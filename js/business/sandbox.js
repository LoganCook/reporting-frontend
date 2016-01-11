var _ = require("lodash");
var util = require("../util");

module.exports = function ($rootScope, $scope, $timeout, reporting) {
    $scope.values = _.values;

    $scope.formatTimestamp = util.formatTimestamp;
    $scope.formatNumber = util.formatNumber;

    var reload = function() {
        $scope.data = {};

        reporting.businessBase(function(svc, type, data) {
            $scope.data[type] = util.keyArray(data);
        });
    };

    reload();
};
