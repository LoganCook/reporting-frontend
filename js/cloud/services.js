// Cacheable data for cloud tabs
'use strict';

define(['app', '../util'], function(app, util) {
  // Get flavor table: filter out private?
  app.factory('flavor', function(queryResource, $q) {
    var flavors = {};

    return function(url) {
      var deferred = $q.defer();
      if (Object.keys(flavors).length > 0) {
          deferred.resolve(flavors);
      } else {
        var nq = queryResource.build(url);
        nq.query({object: 'flavor'}, function(data) {
          flavors = util.keyArray(data, 'openstack_id');
          deferred.resolve(flavors);
        });
      }
      return deferred.promise;
    };
  });

  // Get a tenant at a time and save it for later use
  app.factory('tenant', function(queryResource, $q) {
    var endpoint, tenants = {};

    function get(openstack_id) {
      var deferred = $q.defer();
      if (openstack_id in tenants) {
          deferred.resolve(tenants[openstack_id]);
      } else {
        var nq = queryResource.build(endpoint);
        var filter = 'openstack_id.eq.' + openstack_id;
        nq.query({object: 'tenant', filter: filter}, function(data) {
          delete data[0]['id'];
          delete data[0]['openstack_id'];
          tenants[openstack_id] = data[0];
          deferred.resolve(tenants[openstack_id]);
        });
      }
      return deferred.promise;
    }

    return function(url) {
      endpoint = url;
      return get;
    };
  });

});
