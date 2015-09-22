var _ = require("lodash");

module.exports = function ($scope, $http, $localStorage, $sessionStorage) {
    // TODO: replace prehistoric sandbox code

    /*
    var config = { "headers": { "x-ersa-crm-token": "foo" }};

    $scope.getMembers = function(orgID) {
        var members = $scope.contactsByOrg[orgID];

        if (!members) {
            return "?";
        }

        var truncate = members.length >= 10;
        if (truncate) {
            members = members.slice(0, 9);
        }

        var memberNames = [];

        for (var i in members) {
            memberID = members[i];

            memberNames.push($scope.contactMap[memberID].name);
        }

        if (truncate) {
            memberNames.push("...");
        }

        return memberNames.join(", ");
    };

    $http.get("http://localhost:5031/contact", config).then(function(data) {
        $scope.contactMap = data.data;

        var contactsByOrg = {};

        for (var contactID in data.data) {
            contact = data.data[contactID];

            for (var orgIndex in contact.organisations) {
                var orgID = contact.organisations[orgIndex];

                if (!(orgID in contactsByOrg)) {
                    contactsByOrg[orgID] = [];
                }

                contactsByOrg[orgID].push(contactID);
            }
        }

        $scope.contactsByOrg = contactsByOrg;
    });

    $http.get("http://localhost:5031/organisation", config).then(function(data) {
        $scope.orgMap = data.data;
        $scope.orgValues = _.values(data.data);
    });
    */
};
