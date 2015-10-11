var CRM = require("./client/crm");
var HPC = require("./client/hpc");

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
            loadQuery("crm", type, ["filter=snapshot.eq." + snapshot], callback);
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

    return service;
};
