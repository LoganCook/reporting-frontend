var restler = require("restler");
var util = require("../util");

module.exports = restler.service(function(hostname, token) {
    this.defaults.headers = {
        "x-ersa-auth-token": token
    };
    // this.defaults.baseURL not currently happy with https, so workaround:
    this.base = "https://" + hostname + "/";
}, {}, {
    account: util.api("account"),
    tenant: util.api("tenant"),
    snapshot: util.api("snapshot"),
    domain: util.api("domain"),
    reference: util.api("reference"),
    mapping: util.api("mapping"),
    membership: util.api("membership")
});
