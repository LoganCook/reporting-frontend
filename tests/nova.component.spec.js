define(['cloud/nova.component'], function() {
  describe('nova component', function() {
    var $componentController;

    beforeEach(module('reportingApp'));
    beforeEach(inject(function(_$componentController_) {
      $componentController = _$componentController_;
    }));

    it('should have variables to setup nv-csv and can provide data', function() {
      var ctrl = $componentController('nova', null, {});
      expect(ctrl).toBeDefined();
      expect(ctrl.colTitles).toBeDefined();
      expect(ctrl.fieldNames).toBeDefined();
      expect(ctrl.colTitles.length).toEqual(ctrl.fieldNames.length);
      expect(ctrl.colTitles.length).toBeGreaterThan(2);

      expect(ctrl.csvFileName).toMatch(/\.csv$/);
      var csvData = ctrl.getCsvData();
      expect(csvData.length).toBe(1);
      expect(csvData[0]).toEqual(ctrl.colTitles);
    });

  });
});
