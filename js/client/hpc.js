var restler = require("restler");
var util = require("../util");

module.exports = restler.service(function(hostname, token) {
    this.defaults.headers = {
        "x-ersa-auth-token": token
    };
    // this.defaults.baseURL not currently happy with https, so workaround:
    this.base = "https://" + hostname + "/";
}, {}, {
    host: function() {
        return this.get(this.base + "host");
    },
    queue: function() {
        return this.get(this.base + "queue");
    },
    owner: function() {
        return this.get(this.base + "owner");
    },
    job: function(parameters) {
        return this.get(this.base + "job?" + util.formatParameters(parameters));
    },
    allocation: function(parameters) {
        return this.get(this.base + "allocation?" + util.formatParameters(parameters));
    }
});
