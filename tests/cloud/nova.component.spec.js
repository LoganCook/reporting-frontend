define(['cloud/nova.component'], function() {
  describe('nova component', function() {
    var $componentController;

    beforeEach(module('reportingApp'));
    beforeEach(inject(function(_$componentController_) {
      $componentController = _$componentController_;
    }));

    it('should have variables to setup the HTML table', function() {
      var ctrl = $componentController('nova', null, {});
      expect(ctrl).toBeDefined();
      expect(ctrl.colTitles).toBeDefined();
      expect(ctrl.fieldNames).toBeDefined();
      expect(ctrl.colTitles.length).toEqual(ctrl.fieldNames.length);
      expect(ctrl.colTitles.length).toBeGreaterThan(2);
    });
  });
});
