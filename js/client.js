define(["app", "lodash", "axios", "qs", "./util"], function (app, _, axios, qs, util) {
return function($timeout) {
    var defaultHeaders = function(name) {
        // name not currently used
        return {
            "x-ersa-auth-token": sessionStorage.secret
        };
    };

    var client = function(name) {
        return axios.create({
            baseURL: sessionStorage[name],
            headers: defaultHeaders(name)
        });
    };

    var service = {
        raw: {}
    };

    // API

    var load = function(svc, type, callback) {
        client(svc).get(type + "?count=100000").then(function(response) {
            $timeout(function() {
                if (!(svc in service.raw)) {
                    service.raw[svc] = {};
                }

                service.raw[svc][type] = response.data;

                if (callback) {
                    callback(svc, type, response.data);
                }
            });
        }).catch(function(response) {
            console.log(response);
        });
    };

    var loadQuery = function(svc, type, query, callback) {
        var queryString = qs.stringify(query, { arrayFormat: "repeat" });

        var queryClient = client(svc);
        var execute;

        if (queryString.length < 1024) {
            execute = queryClient.get(type + "?" + queryString);
        } else {
            execute = queryClient.post(type, queryString, {
                headers: _.merge(defaultHeaders(svc), {
                    "Content-Type": "application/x-www-form-urlencoded"
                })
            });
        }

        var handle = function(response) {
            $timeout(function() {
                if (!(svc in service.raw)) {
                    service.raw[svc] = {};
                }

                if (!(type in service.raw[svc])) {
                    service.raw[svc][type] = {};
                }

                service.raw[svc][type][query] = response.data;

                if (callback) {
                    callback(svc, type, query, response.data);
                }
            });
        };

        execute.then(handle).catch(function(response) {
            if (response.status == 404) {
                handle(response); // 404 signifies EOF
            } else {
                console.log(response);
            }
        });
    };

    service.query = function(svc, type, query, callback) {
        loadQuery(svc, type, query, callback);
    };

    // CRM

    service.crmBase = function(callback) {
        ["snapshot", "person", "organisation", "username", "email"].forEach(function(type) {
            load("crm", type, callback);
        });
    };

    service.crmSnapshot = function(snapshot, callback) {
        ["membership", "person-username", "person-email"].forEach(function(type) {
            loadQuery("crm", type, { count: 10000, filter: "snapshot.eq." + snapshot }, callback);
        });
    };

    // HPC

    service.hpcBase = function(callback) {
        ["host", "queue", "owner"].forEach(function(type) {
            load("hpc", type, callback);
        });
    };

    service.hpcQuery = function(type, query, callback) {
        loadQuery("hpc", type, query, callback);
    };

    // XFS

    service.xfsBase = function(callback) {
        ["snapshot", "host", "filesystem", "owner"].forEach(function(type) {
            load("xfs", type, callback);
        });
    };

    service.xfsQuery = function(type, query, callback) {
        loadQuery("xfs", type, query, callback);
    };

    // Business

    service.businessBase = function(callback) {
        ["entity", "entity/type", "entity/name", "entity/relationship",
            "attribute/integer", "attribute/float", "attribute/string",
            "mapping/name", "mapping/attribute/integer",
            "mapping/attribute/float", "mapping/attribute/string"
        ].forEach(function(type) {
            load("business", type, callback);
        });
    };

    service.businessQuery = function(type, query, callback) {
        loadQuery("business", type, query, callback);
    };

    // Keystone

    service.keystoneBase = function(callback) {
        ["snapshot", "account", "tenant", "domain", "reference"].forEach(function(type) {
            load("keystone", type, callback);
        });
    };

    service.keystoneQuery = function(type, query, callback) {
        loadQuery("keystone", type, query, callback);
    };

    // Generic

    service.populateFromUsername = function(snapshot, object) {
        var top = this;

        if (!("crmLookup" in top)) {
            top.crmLookup = {};

            for (var type in top.raw.crm) {
                if (type == "username") {
                    top.crmLookup[type] = util.keyArray(top.raw.crm[type], "username");
                } else {
                    top.crmLookup[type] = util.keyArray(top.raw.crm[type]);
                }
            }
        }

/*        if (!(object.username in top.crmLookup.username)) {
            object.fullname = "?";
            object.organisation = "?";
        } else {*/
            //var usernameID = top.crmLookup.username[object.username].id;

            var usernameFilters = {
                filter: [
                    "snapshot.eq." + snapshot//,
                    //"username.eq." + usernameID
                ]
            };

            top.query("crm", "person-username", usernameFilters, function(svc, type, query, data) {
                if (data) {
                    var personID = data[0].person;
                    var person = top.crmLookup.person[personID];

                    if (person) {
                        object.fullname = person.first_name + " " + person.last_name;
                    }

                    var membershipFilters = {
                        filter: [
                            "snapshot.eq." + snapshot,
                            "person.eq." + personID
                        ]
                    };

                    top.query("crm", "membership", membershipFilters, function(svc, type, query, data) {
                        var orgNames = [];

                        _.forEach(data, function(entry) {
                            var orgID = entry.organisation;
                            var org = top.crmLookup.organisation[orgID];
                            orgNames.push(org.name);
                        });

                        object.organisation = orgNames.join(" / ");
                    });
                } else {
                    object.fullname = "?";
                }
            });
        //}
    };

    return service;
};
});
