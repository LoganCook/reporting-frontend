var restler = require("restler");
var util = require("../util");

module.exports = restler.service(function(hostname, token) {
    this.defaults.headers = {
        "x-ersa-auth-token": token
    };
    // this.defaults.baseURL not currently happy with https, so workaround:
    this.base = "https://" + hostname + "/";
}, {}, {
    snapshots: util.api("snapshot"),
    organisations: util.api("organisation"),
    people: util.api("person"),
    membership: util.api("membership"),
    usernames: util.api("username"),
    addresses: util.api("email"),
    addressMapping: util.api("person-email"),
    usernameMapping: util.api("person-username")
});
