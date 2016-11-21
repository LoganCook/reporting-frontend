define(['util2', 'util'], function (util, utilOld) {
  describe('Utility date functions', function () {
    it('shoud throw error if non Date object is given', function () {
      expect(function () {
        util.dateToTimestamp('string');
      }).toThrow();
      expect(function () {
        util.dateToTimestamp('string');
      }).toThrowError(TypeError, 'Only Date type is acceptable');
    });

    it('dateToTimestamp should get a day"s difference of 23:59:59', function () {
      var d = new Date(2016, 0, 1),
        start = util.dateToTimestamp(d),
        end = util.dateToTimestamp(d, true);
      expect(end - start).toEqual(86399);
    });

    it('witinCurrentMonth should distinguish ', function() {
      expect(util.withinCurrentMonth(new Date())).toBe(true);
      expect(util.withinCurrentMonth(new Date(2016, 0, 1))).toBe(false);
    });
  });

  describe('Functions from old Utility module', function () {
    var aMap, fArray;
    beforeEach(function () {
      aMap = {
        org1: {
          subOrg1: {usage: 1000, blocks: 1, cost: 5},
          subOrg2: {usage: 1000, blocks: 1, cost: 5}
        },
        org2: {
          '?': {usage: 1000, blocks: 1, cost: 5},
          Grand: {usage: 1000, blocks: 1, cost: 5}
        }
      };
      fArray = [
        {'billing': 'org1', 'organisation': 'subOrg1', 'usage': 1000, 'blocks': 1, 'cost': 5},
        {'billing': 'org1', 'organisation': 'subOrg2', 'usage': 1000, 'blocks': 1, 'cost': 5},
        {'billing': 'org2', 'organisation': '?', 'usage': 1000, 'blocks': 1, 'cost': 5},
        {'billing': 'org2', 'organisation': 'Grand', 'usage': 1000, 'blocks': 1, 'cost': 5}
        ];
    });

    it('deflate should get an array from a map', function () {
      var k1 = 'billing',
        k2 = 'organisation';
      var newArray = utilOld.deflate(aMap, k1, k2);
      expect(newArray).toEqual(fArray);
    });

    it('inflate should get a map from an array', function () {
      var k1 = 'billing',
        k2 = 'organisation';
      var newMap = utilOld.inflate(fArray, k1, k2);
      expect(newMap).toEqual(aMap);
    });

    it('spliceOne should return an object only and change the source array if found', function() {
      var target = {
        interested: "target",
        k1: 2,
        k2: 3
      }, source = [{
        interested: "non-target",
        k1: 2,
        k2: 3
      },
      target,
      {
        interested: "non-target",
        k1: 2,
        k2: 3
      }, target], l = source.length;
      var x = utilOld.spliceOne(source, 'interested', 'target');
      expect(x).toEqual(target);
      expect(source.length).toEqual(l - 1);

      x = utilOld.spliceOne(source, 'k1', 10);
      expect(x).toEqual(null);
      expect(source.length).toEqual(l - 1);
    });
  });
});