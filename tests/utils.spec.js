define(['util2'], function(util) {

  describe('Utility functions', function() {
    it('shoud throw error if non Date object is given', function() {
      expect(function() {
        util.dateToTimestamp('string');
      }).toThrow();
      expect(function() {
        util.dateToTimestamp('string');
      }).toThrowError(TypeError, 'Only Date type is acceptable');
    });

    it('should get a day"s difference of 23:59:59', function() {
      var d = new Date(2016, 0, 1),
        start = util.dateToTimestamp(d),
        end = util.dateToTimestamp(d, true);
      expect(end - start).toEqual(86399);
    });

  });
});
