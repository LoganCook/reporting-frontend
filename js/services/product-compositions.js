  define(['app', 'options'], function (app, options) {
    'use strict';

    /* in option, there is an optional key: product-composition
    "product-composition": {
      "tangocloudvm": {
        "core": "vmcpu",
        "ram": "vmmemory",
        "disk-usage": "vmdisk"
      }
    */
    app.factory('compositions', function () {
      var compositions = 'product-composition' in options ? options['product-composition'] : {};

      return function getCompositions(shortName)
      {
        if (shortName in compositions) {
          return compositions[shortName];
        } else {
          return {};
        }
      };
    });
  });
