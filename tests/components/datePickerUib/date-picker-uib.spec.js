define(['datePickerUib'], function() {
  describe('pageComponent: datePickerUib', function() {
    var $componentController;

    beforeEach(module('pageComponents'));
    beforeEach(inject(function(_$componentController_) {
      $componentController = _$componentController_;
    }));

    it('should be closed by default', function() {
      var ctrl = $componentController('datePickerUib', null, {
        picker: {}
      });
      expect(ctrl.opened).toBe(false);
    });

    it('should expose a `picker` object with at least default keys', function() {
      var bindings = {
        picker: {}
      };
      var ctrl = $componentController('datePickerUib', null, bindings);

      expect(ctrl.picker).toBeDefined();
      expect(Object.keys(ctrl.picker).length).toBeGreaterThan(1);
      expect(ctrl.picker.class).toEqual('col-md-6');
      expect(ctrl.picker.format).toEqual('dd/MM/yyyy');
    });

    it('should accept extra keys for picker', function() {
      var setDate = new Date();
      var bindings = {
        picker: {
          date: setDate,
          title: 'test'
        }
      };
      var ctrl = $componentController('datePickerUib', null, bindings);

      expect(ctrl.picker).toBeDefined();
      expect(Object.keys(ctrl.picker).length).toEqual(4);
      expect(ctrl.picker.date.toISOString()).toEqual(setDate.toISOString());
      expect(ctrl.picker.title).toEqual('test');
    });

    it('should have default option with only maxDate as today', function() {
      var ctrl = $componentController('datePickerUib', null, {
        picker: {}
      });

      expect(ctrl.options.maxDate.toDateString()).toEqual((new Date()).toDateString());
    });

    it('should have allow minDate to be set in options', function() {
      var bindings = {
        picker: {
          minDate: new Date(2016, 0, 1),
          title: 'test'
        }
      };
      var ctrl = $componentController('datePickerUib', null, bindings);

      expect('maxDate' in ctrl.options).toBe(true);
      expect('minDate' in ctrl.options).toBe(true);
      expect(ctrl.options.minDate).toEqual(bindings.picker.minDate);
    });

  });
});
