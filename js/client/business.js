var restler = require("restler");
var util = require("../util");

module.exports = restler.service(function(hostname, token) {
    this.defaults.headers = {
        "x-ersa-auth-token": token
    };
    // this.defaults.baseURL not currently happy with https, so workaround:
    this.base = "http://" + hostname + "/";
}, {}, {
    entity: util.api("entity"),
    entityType: util.api("entity/type"),
    entityName: util.api("entity/name"),
    entityRelationship: util.api("entity/relationship"),
    integerAttribute: util.api("attribute/integer"),
    floatAttribute: util.api("attribute/float"),
    stringAttribute: util.api("attribute/string"),
    nameMapping: util.api("mapping/name"),
    relationshipMapping: util.api("mapping/relationship"),
    integerAttributeMapping: util.api("mapping/attribute/integer"),
    floatAttributeMapping: util.api("mapping/attribute/float"),
    stringAttributeMapping: util.api("mapping/attribute/string")
});
