define(['pageComponents'], function(module) {
    'use strict';
    module.component('datePickerUib', {
        templateUrl: 'js/components/datePickerUib/date-picker-uib.html',
        controller: function DateRangeController() {
            var defaults = {
                'class': 'col-md-6',
                'format': 'dd/MM/yyyy'
            };

            var ctrl = this;
            angular.forEach(defaults, function(value, key) {
                if (!(key in ctrl.picker)) {
                    ctrl.picker[key] = value;
                }
            });

            ctrl.options = {
                maxDate: new Date()
            };
            if ('minDate' in ctrl.picker) {
                ctrl.options['minDate'] = ctrl.picker['minDate'];
            }

            ctrl.opened = false;
            ctrl.show = function() {
                ctrl.opened = true;
            };
        },
        bindings: {
            picker: '<'
        }
    });
});
