var _ = require("lodash");

var CRM = require("./client/crm");
var HPC = require("./client/hpc");
var XFS = require("./client/xfs");
var Keystone = require("./client/keystone");

var util = require("./util");

module.exports = function($localStorage, $timeout) {
    var service = {
        raw: {}
    };

    var load = function(svc, type, callback) {
        service[svc]()[type]().on("complete", function(data) {
            $timeout(function() {
                if (!(svc in service.raw)) {
                    service.raw[svc] = {};
                }

                service.raw[svc][type] = data;

                if (callback) {
                    callback(svc, type, data);
                }
            });
        });
    };

    var loadQuery = function(svc, type, query, callback) {
        service[svc]()[type](query).on("complete", function(data) {
            $timeout(function() {
                if (!(svc in service.raw)) {
                    service.raw[svc] = {};
                }

                if (!(type in service.raw[svc])) {
                    service.raw[svc][type] = {};
                }

                service.raw[svc][type][query] = data;

                if (callback) {
                    callback(svc, type, query, data);
                }
            });
        });
    };

    service.crm = function() {
        return new CRM($localStorage.endpoints.CRM.endpoint, $localStorage.endpoints.CRM.token);
    };

    service.crmBase = function(callback) {
        ["snapshots", "people", "organisations", "usernames", "addresses"].forEach(function(type) {
            load("crm", type, callback);
        });
    };

    service.crmSnapshot = function(snapshot, callback) {
        ["membership", "usernameMapping", "addressMapping"].forEach(function(type) {
            loadQuery("crm", type, ["count=10000", "filter=snapshot.eq." + snapshot], callback);
        });
    };

    service.query = function(svc, type, query, callback) {
        loadQuery(svc, type, query, callback);
    };

    service.hpc = function() {
        return new HPC($localStorage.endpoints.HPC.endpoint, $localStorage.endpoints.HPC.token);
    };

    service.hpcBase = function(callback) {
        ["host", "queue", "owner"].forEach(function(type) {
            load("hpc", type, callback);
        });
    };

    service.hpcQuery = function(type, query, callback) {
        loadQuery("hpc", type, query, callback);
    };

    service.xfs = function() {
        return new XFS($localStorage.endpoints.XFS.endpoint, $localStorage.endpoints.XFS.token);
    };

    service.xfsBase = function(callback) {
        ["snapshot", "host", "filesystem", "owner"].forEach(function(type) {
            load("xfs", type, callback);
        });
    };

    service.xfsQuery = function(type, query, callback) {
        loadQuery("xfs", type, query, callback);
    };

    service.keystone = function() {
        return new Keystone($localStorage.endpoints.Keystone.endpoint, $localStorage.endpoints.Keystone.token);
    };

    service.keystoneBase = function(callback) {
        ["snapshot", "account", "tenant", "domain", "reference"].forEach(function(type) {
            load("keystone", type, callback);
        });
    };

    service.keystoneQuery = function(type, query, callback) {
        loadQuery("keystone", type, query, callback);
    };

    service.populateFromUsername = function(snapshot, object) {
        var top = this;

        if (!("crmLookup" in top)) {
            top.crmLookup = {};

            for (var type in top.raw.crm) {
                if (type == "usernames") {
                    top.crmLookup[type] = util.keyArray(top.raw.crm[type], "username");
                } else {
                    top.crmLookup[type] = util.keyArray(top.raw.crm[type]);
                }
            }
        }

        if (!(object.username in top.crmLookup.usernames)) {
            object.fullname = "?";
            object.organisation = "?";
        } else {
            var usernameID = top.crmLookup.usernames[object.username].id;

            var usernameFilters = [
                "filter=snapshot.eq." + snapshot,
                "filter=username.eq." + usernameID
            ];

            top.query("crm", "usernameMapping", usernameFilters, function(svc, type, query, data) {
                if (data) {
                    var personID = data[0].person;
                    var person = top.crmLookup.people[personID];

                    if (person) {
                        object.fullname = person.first_name + " " + person.last_name;
                    }

                    var membershipFilters = [
                        "filter=snapshot.eq." + snapshot,
                        "filter=person.eq." + personID
                    ];

                    top.query("crm", "membership", membershipFilters, function(svc, type, query, data) {
                        var orgNames = [];

                        _.forEach(data, function(entry) {
                            var orgID = entry.organisation;
                            var org = top.crmLookup.organisations[orgID];
                            orgNames.push(org.name);
                        });

                        object.organisation = orgNames.join(" / ");
                    });
                } else {
                    object.fullname = "?";
                }
            });
        }
    };

    return service;
};
