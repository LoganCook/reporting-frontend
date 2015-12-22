var _ = require("lodash");
var util = require("../util");

module.exports = function ($rootScope, $scope, $timeout, $localStorage, $sessionStorage, reporting) {
    $scope.values = _.values;

    $scope.formatTimestamp = util.formatTimestamp;
    $scope.formatNumber = util.formatNumber;

    var reload = function() {
        reporting.businessBase(function(svc, type, data) {
            $scope[type] = util.keyArray(data);
        });
    };

    reload();
};
