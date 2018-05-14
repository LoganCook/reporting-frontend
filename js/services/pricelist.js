  define(['app'], function (app) {
    'use strict';

    // Cacheable product price list: always short names, see bman.dynamicsp.view for details
    app.factory('pricelist', function (queryResource, $q) {
      var prices = {};

      return function(shortName) {
        const uri = sessionStorage['bman'] + '/api/pricelist/?product=' + shortName;
        var deferred = $q.defer();
        if (shortName in prices) {
            deferred.resolve(prices[shortName]);
        } else {
          var nq = queryResource.build(uri);
          // this is an ugly fix to keep the end tailing slash
          nq.queryNoHeader({}, function(data) {
            prices[shortName] = data;
            deferred.resolve(prices[shortName]);
          }, function(rsp) {
              alert("Data could not be retrieved. Please try it later.");
              console.log(rsp);
              deferred.reject([]);
          });
        }
        return deferred.promise;
      };
    });
  });