define(['util2', 'util'], function (util, utilOld) {
  describe('Utility date functions', function () {
    it('should throw error if non Date object is given', function () {
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

    it('withinCurrentMonth should distinguish ', function() {
      var current = new Date();
      expect(util.withinCurrentMonth(current)).toBe(true);
      var differentMonth = current.getMonth() + 1;
      differentMonth = differentMonth == 12 ? 0 : differentMonth;
      expect(util.withinCurrentMonth(new Date(2016, differentMonth, 1))).toBe(false);
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

    describe('deflate', function () {
      it('should get an array from a map', function () {
        var k1 = 'billing',
          k2 = 'organisation';
        var newArray = utilOld.deflate(aMap, k1, k2);
        expect(newArray).toEqual(fArray);
      });
    })

    describe('inflate', function () {
      it('should get a map from an array', function () {
        var k1 = 'billing',
          k2 = 'organisation';
        var newMap = utilOld.inflate(fArray, k1, k2);
        expect(newMap).toEqual(aMap);
      });

      it('should drop rows that do not have the k1 value', function () {
        var rows = [
          {type: 'warm', colour: 'yellow'},
          {/*no 'type'*/ colour: 'red'},
          {type: 'cold', colour: 'blue'}
        ]
        var k1 = 'type'
        var result = utilOld.inflate(rows, k1)
        expect(result).toEqual({
          warm: {colour: 'yellow'},
          cold: {colour: 'blue'}
        })
      })

      // We probably don't want this but the test confirms that it happens
      it('should do some weird steamrolling behaviour when the k2 value is not consistently populated', function () {
        var rows = [
          {type: 'warm', luminosity: 'high', colour: 'yellow'},
          {type: 'warm', /* no luminosity*/ colour: 'red'},
          {type: 'cold', luminosity: 'low', colour: 'blue'}
        ]
        var k1 = 'type'
        var k2 = 'luminosity'
        var result = utilOld.inflate(rows, k1, k2)
        expect(result).toEqual({
          warm: {
            high: {
              colour: 'red' // this value streamrolls the yellow because the 'level2' var is outside the loop
            }
          },
          cold: {
            low: {
              colour: 'blue'
            }
          }
        })
      })
    })

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

  describe('Function convertContractPrice', function() {
    it('should change price to what we want', function() {
      var itemCount = 3, originalPrice = 1000, denominator = 12, contracts = {}, i;
      var convertedPrice = originalPrice / denominator;
      for (i = 0; i < itemCount; i++) {
        contracts["id" + i] = {
          "name": "item" + i,
          "unitPrice": originalPrice
        };
      }
      utilOld.convertContractPrice(contracts, denominator);
      expect(Object.keys(contracts).length).toEqual(itemCount);
      for (i = 0; i < itemCount; i++) {
        expect(contracts["id" + i]["unitPrice"]).toEqual(convertedPrice);
      }
    });

    it('should only convert price once', function() {
      var itemCount = 3, originalPrice = 1000, denominator = 12, contracts = {}, i;
      var convertedPrice = originalPrice / denominator;
      for (i = 0; i < itemCount; i++) {
        contracts["id" + i] = {
          "name": "item" + i,
          "unitPrice": originalPrice
        };
      }
      utilOld.convertContractPrice(contracts, denominator);
      utilOld.convertContractPrice(contracts, denominator);
      utilOld.convertContractPrice(contracts, denominator);
      expect(Object.keys(contracts).length).toEqual(itemCount);
      for (i = 0; i < itemCount; i++) {
        expect(contracts["id" + i]["unitPrice"]).toEqual(convertedPrice);
      }
    });

    it('should throw error when there is no denominator', function() {
      expect(function () {
        utilOld.convertContractPrice({});
      }).toThrowError(Error, 'Missing denominator');
    });

    it('should throw error when there is no unitPrice in a contract', function() {
      var badContact = {
        someId: {
          name: "bad"
        }
      };
      expect(function () {
        utilOld.convertContractPrice(badContact, 1);
      }).toThrow();
    });
  });

  describe('Function createDefaults', function() {
    it('should have all values is zero', function() {
      var fieldCount = Math.ceil(Math.random() * 10), i, fields = [];
      for (i = 1; i <= fieldCount; i++) {
        fields.push('field' + i);
      }

      var defaults = utilOld.createDefaults(fields);
      expect(Object.keys(defaults).length).toEqual(fieldCount);
      var total = 0;
      for (i = 1; i <= fieldCount; i++) {
        total += defaults['field' + i];
      }
      expect(total).toEqual(0);
    });
  });

  describe('Function keyArray', function() {
    const arraySize = 10, keyCount = 4;

    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }

    function dummyObject(size, keyToRandomise) {
      var dummy = {};
      for (var i = 0; i < size; i++) {
        dummy['key' + i] = 'value' + i;
      }
      dummy[keyToRandomise] = 'value' + getRandomInt(1000);
      return dummy;
    }

    function constructArray() {
      var i, orginalArray = [];
      for (i = 0; i < arraySize; i++) {
        orginalArray.push(dummyObject(keyCount, keyInInterested));
      }
      return orginalArray;
    }

    var keyInInterested = 'key' + getRandomInt(keyCount);

    it('should convert an array of dict to a dict with value of specified key as key', function() {
      var newObject = utilOld.keyArray(constructArray(), keyInInterested);
      expect(Object.keys(newObject).length).toBeLessThanOrEqual(arraySize);
    });

    it('should not convert object if value of key is undefined', function() {
      var orginalArray = constructArray();
      delete orginalArray[getRandomInt(arraySize)][keyInInterested];

      var newObject = utilOld.keyArray(orginalArray, keyInInterested);
      expect(Object.keys(newObject).length).toBeLessThan(arraySize);
      Object.keys(newObject).forEach(function(key) {
        expect(typeof key != 'undefined').toBe(true);
      });
    });
  });
});