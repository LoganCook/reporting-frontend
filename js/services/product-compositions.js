  define(['app'], function (app) {
    'use strict';

    // Cacheable product composition: always short names, see bman.dynamicsp.view for details
    app.factory('compositions', function (queryResource, $q) {
      var compositions = {};

      function load() {
        const uri = sessionStorage['bman'] + '/api';
        var deferred = $q.defer();
        if (Object.keys(compositions).length > 0) {
            deferred.resolve(compositions);
        } else {
          var nq = queryResource.build(uri);
          // this is an ugly fix to keep the end tailing slash
          nq.getNoHeader({object: 'composed_products/'}, function(data) {
            compositions = data;
            deferred.resolve(compositions);
          }, function(rsp) {
              alert("Data could not be retrieved. Please try it later.");
              console.log(rsp);
              deferred.reject({});
          });
        }
        return deferred.promise;
      };

      return {
        getCompositions: function(shortName) {
          return load().then(function (data) {
            if (shortName in data) {
              return data[shortName];
            } else {
              return [];
            }
          });
        }
      };
    });
  });