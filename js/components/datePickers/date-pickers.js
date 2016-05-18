define(['pageComponents', 'datePickerUib'], function(module) {
    'use strict';
    module.component('datePickers', {
        templateUrl: 'js/components/datePickers/date-pickers.html',
        controller: function DateRangeController() {
            var ctrl = this;

            ctrl.collect = function() {
                // call back function to collect dates from child components
                var dates = [];
                angular.forEach(ctrl.pickers, function(d) {
                    dates.push(d.date);
                });
                // call back parent
                ctrl.onDone({
                    dates: dates
                });
            };
        },
        bindings: {
            buttonTilte: '@',
            pickers: '<',
            onDone: '&'
        }
    });

});
