var _ = require("lodash");
var util = require("../util");

module.exports = function ($rootScope, $scope, $timeout, $localStorage, $sessionStorage, reporting) {
    $scope.values = _.values;

    $scope.formatTimestamp = util.formatTimestamp;

    $scope.snapshots = {};

    $scope.select = {
        id: null // snapshot id
    };

    $scope.snapshot = {
        "membership": [],
        "addressMapping": [],
        "usernameMapping": []
    };

    $scope.snapshotByPerson = {
        "membership": {},
        "addressMapping": {},
        "usernameMapping": {}
    };

    var relevantField = {
        "membership": "organisation",
        "usernameMapping": "username",
        "addressMapping": "email"
    };

    var humanReadableContent = {
        "membership": "organisations",
        "usernameMapping": "usernames",
        "addressMapping": "addresses"
    };

    var humanReadableField = {
        "membership": "name",
        "usernameMapping": "username",
        "addressMapping": "address"
    };

    $scope.selectSnapshot = function() {
        if ($scope.select.id) {
            reporting.crmSnapshot($scope.select.id, function(svc, type, snapshot, data) {
                $scope.snapshot[type] = data;
                $scope.snapshotByPerson[type] = {};

                var groupedByPerson = _.groupBy(data, util.extractor("person"));

                var extractField = function(record) {
                    return record[relevantField[type]];
                };

                var getReadable = function(ref) {
                    var content = humanReadableContent[type];
                    var field = humanReadableField[type];
                    return $scope[content][ref][field];
                };

                var generateReadable = function(refs) {
                    return _.map(refs, getReadable).join(", ");
                };

                for (var person in groupedByPerson) {
                    var refs = _.map(groupedByPerson[person], extractField);
                    $scope.snapshotByPerson[type][person] = generateReadable(refs);
                }

                if (type == "membership") {
                    var groupedByOrganisation = _.groupBy(data, util.extractor("organisation"));

                    var extractPerson = function(record) {
                        var entity = $scope.people[record.person];

                        return entity.first_name + " " + entity.last_name;
                    };

                    for (var organisation in groupedByOrganisation) {
                        groupedByOrganisation[organisation] =
                            _.map(groupedByOrganisation[organisation], extractPerson).join(", ");
                    }

                    $scope.membershipByOrganisation = groupedByOrganisation;
                }
            });
        } else {
            for (var type in $scope.snapshot) {
                $scope.snapshot[type] = [];
                $scope.snapshotByPerson[type] = {};
            }
        }
    };

    reporting.crmBase(function(svc, type, data) {
        $scope[type] = util.keyArray(data);
    });
};
