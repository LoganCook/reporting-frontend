var restler = require("restler");
var util = require("../util");

module.exports = restler.service(function(hostname, token) {
    this.defaults.headers = {
        "x-ersa-auth-token": token
    };
    // this.defaults.baseURL not currently happy with https, so workaround:
    this.base = "https://" + hostname + "/";
}, {}, {
    snapshots: function() {
        return this.get(this.base + "snapshot");
    },
    organisations: function() {
        return this.get(this.base + "organisation");
    },
    people: function() {
        return this.get(this.base + "person");
    },
    membership: function(parameters) {
        return this.get(this.base + "membership?" + util.formatParameters(parameters));
    },
    usernames: function() {
        return this.get(this.base + "username");
    },
    addresses: function() {
        return this.get(this.base + "email");
    },
    addressMapping: function(parameters) {
        return this.get(this.base + "person-email?" + util.formatParameters(parameters));
    },
    usernameMapping: function(parameters) {
        return this.get(this.base + "person-username?" + util.formatParameters(parameters));
    }
});
