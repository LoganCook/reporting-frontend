define(['components/datePickers/date-pickers'], function() {
  describe('pageComponent: datePickers', function() {
    var $componentController;

    beforeEach(module('pageComponents'));
    beforeEach(inject(function(_$componentController_) {
      $componentController = _$componentController_;
    }));

    it('should expose values: buttonTitle and pickers', function() {
      var bindings = {
        buttonTilte: 'test',
        pickers: []
      };

      var ctrl = $componentController('datePickers', null, bindings);
      expect(ctrl.buttonTilte).toEqual('test');
      expect(ctrl.pickers).toBeDefined();
      expect(ctrl.pickers.length).toEqual(0);
    });

    it('should call the `collect` binding with an array of dates', function() {
      var onDoneSpy = jasmine.createSpy('onDone');
      var date1 = new Date(2016, 6, 1),
        date2 = new Date(2016, 7, 14);
      var pickers = [{
        title: 'start',
        class: 'col-md-3',
        date: date1
      }, {
        title: 'end',
        class: 'col-md-3',
        date: date2
      }];

      var bindings = {
        onDone: onDoneSpy,
        pickers: pickers
      };

      var ctrl = $componentController('datePickers', null, bindings);

      ctrl.collect();
      expect(onDoneSpy).toHaveBeenCalledWith({
        dates: [date1, date2]
      });
    });
  });
});
