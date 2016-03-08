define(["app", "lodash", "../util" ], function (app, _, util) {
    app.controller("CRMController", ["$rootScope", "$scope", "$timeout", "reporting", function($rootScope, $scope, $timeout, reporting) {
        $scope.values = _.values;
        $scope.formatTimestamp = util.formatTimestamp;
        $scope.select = {
            id: null // snapshot id
        };

        $scope.snapshotByPerson = {
            "membership": {},
            "person-email": {},
            "person-username": {}
        };

        var relevantField = {
            "membership": "organisation",
            "person-username": "username",
            "person-email": "email"
        };

        var humanReadableContent = {
            "membership": "organisation",
            "person-username": "username",
            "person-email": "email"
        };

        var humanReadableField = {
            "membership": "name",
            "person-username": "username",
            "person-email": "address"
        };

        $scope.selectSnapshot = function() {
            if ($scope.select.id) {
                reporting.crmSnapshot($scope.select.id, function(svc, type, snapshot, data) {
                    $scope.snapshotByPerson[type] = {};

                    var groupedByPerson = _.groupBy(data, util.extractor("person"));

                    var extractField = function(record) {
                        return record[relevantField[type]];
                    };

                    var getReadable = function(ref) {
                        var content = humanReadableContent[type];
                        var field = humanReadableField[type];

                        var entry = $scope[content][ref];

                        if (entry) {
                            return entry[field];
                        } else {
                            return "?";
                        }
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
                            var entity = $scope.person[record.person];

                            if (entity) {
                                return entity.first_name + " " + entity.last_name;
                            } else {
                                return "?";
                            }
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
                    $scope.snapshotByPerson[type] = {};
                }
            }
        };

        reporting.crmBase(function(svc, type, data) {
            $scope[type] = util.keyArray(data);
        });
    }]);
});
