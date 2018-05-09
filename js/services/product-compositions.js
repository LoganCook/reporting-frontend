  define(['app', 'options'], function (app, options) {
    'use strict';

    /* in option, there is an optional key: product-composition
    "product-composition": {
      "tangocloudvm": {
        "core": "vmcpu",
        "ram": "vmmemory",
        "disk-usage": "vmdisk",
        "start-date": 14100000,
        "end-date": 150000
      }
    */
   // If price of a composed product changes in the whole period of
   // reporting-frontend serves, set start-date and optionl end-date,
   // we can have on - off effective price time range but not
   // multiple non-continue ranges: either one start-date or one 
   // start-date and one end-date or nothing
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
