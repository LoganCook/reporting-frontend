define(["app", "lodash", "axios", "qs", "./util"], function (app, _, axios, qs, util) {
return function($timeout, queryResource) {
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

    function load(svc, type, callback) {
      console.log("Query on ", svc, type);
      var nq = queryResource.build(sessionStorage[svc]);

      var args = {"object": type, "count": 5000, "page": 1};

      if (!(svc in service.raw)) {
        service.raw[svc] = {};
      }
      service.raw[svc][type] = [];

      function append(data) {
        if (data && data.length) {
          console.log(svc, type, ": cache data before appending", service.raw[svc][type].length);
          console.log("Received data", data.length);
          Array.prototype.push.apply(service.raw[svc][type], data);
          console.log("Cache data after appending", service.raw[svc][type].length);
          args["page"]++;
          console.log("Try one more query on page ", args["page"]);
          nq.query(args, append, returnCall);
        } else {
          returnCall();
        }
      }

      // This is used when paginated query failed instead of []: e.g. default fashion of error_out=True in Flask-SQLAlchemy
      function returnCall(httpResponse) {
        // Actual error callback has httpResponse as its argument
        if (httpResponse) {
          console.log("Query is finished in error. Return to caller ");
          console.warn("Error:", httpResponse.status, " ", httpResponse.statusText);
          console.warn("Error:", JSON.stringify(httpResponse));
        } else {
          console.log("Query is finished in normal fashion. return to caller ");
        }

        if (callback) {
            callback(svc, type, service.raw[svc][type]);
        } else {
          throw "No callback for the query: " + JSON.stringify(args);
        }
      }

      nq.query(args, append, returnCall);
    }

    // FIXME: this is the most ugly query - breaks convention of GET and POST metohds
    var loadQuery = function(svc, type, query, callback) {
        var queryString = qs.stringify(query, { arrayFormat: "repeat" });
        console.log("query string: " + JSON.stringify(query));

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
                    console.log("old response data: ", response.data);
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

        // Post is not a post, ordinary post method in agnularjs does not work until I fix unified API post method
        // var nq = queryResource.build(sessionStorage[svc]);
        // //console.log("checking nq in client.js: " + JSON.stringify(query));
        // // var myQ = JSON.stringify(query);
        // // console.log("Are they the same? ")
        // // console.log(myQ);
        // // console.log(queryString); //This is a query string, not a form data
        // if (JSON.stringify(query).length >= 1024) {
        //   // not working as it is not a query string which is expected by the API server
        //   //~ nq.post({'object':type}, JSON.stringify(query), function(data){
        //   //nq.post({'object':type}, queryString, function(data){
        //   // nq.post({'object':type}, query, function(data){
        //   // nq.post({'object':type}, {count:40}, function(data){
        //   nq.post({'object':type}, "count=40", function(data){ // post form body has to be a string of query? WTF
        //     console.log("Bloody thing by post:");
        //     console.log(data.length);
        //   });
        // } else {
        //   angular.extend(query, {'object':type});
        //   nq.query(query, function(data){
        //     console.log("Bloody thing:");
        //     console.log(data);
        //   });
        // }
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

    // Nova

    service.novaBase = function(callback) {
        ["az", "flavor", "hypervisor"].forEach(function(type) {
            load("nova", type, callback);
        });
    };

    service.novaQuery = function(type, query, callback) {
        loadQuery("nova", type, query, callback);
    };

    // Hnas

    service.hnasBase = function(callback) {
        ["filesystem", "owner"].forEach(function(type) {
            load("hnas", type, callback);
        });
    };

    service.hnasQuery = function(type, query, callback) {
        loadQuery("hnas", type, query, callback);
    };

    // Hcp

    service.hcpBase = function(callback) {
        ["allocation"].forEach(function(type) {
            load("hcp", type, callback);
        });
    };

    service.hcpQuery = function(type, query, callback) {
        loadQuery("hcp", type, query, callback);
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

        if (!(object.username in top.crmLookup.username)) {
            object.fullname = "?";
            object.organisation = "?";
        } else {
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
        }
    };

    return service;
};
});
