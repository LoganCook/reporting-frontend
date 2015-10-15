var restler = require("restler");
var util = require("../util");

module.exports = restler.service(function(hostname, token) {
    this.defaults.headers = {
        "x-ersa-auth-token": token
    };
    // this.defaults.baseURL not currently happy with https, so workaround:
    this.base = "https://" + hostname + "/";
}, {}, {
    host: util.api("host"),
    filesystem: util.api("filesystem"),
    snapshot: util.api("snapshot"),
    usage: util.api("usage"),
    owner: util.api("owner")
});
