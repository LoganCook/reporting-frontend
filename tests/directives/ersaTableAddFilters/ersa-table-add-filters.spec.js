define(['ersaTableAddFilters'], function(ersaTableAddFilters) {
  describe('reduceToSingleFieldName', function() {
    it('should be able to handle a simple field name', function() {
      var simpleFieldName = 'someField'
      var result = ersaTableAddFilters._testonly.reduceToSingleFieldName(simpleFieldName)
      expect(result).toBe('someField')
    })

    it('should be able to handle a function call with a single field name', function() {
      var simpleFieldName = "func('someField')"
      var result = ersaTableAddFilters._testonly.reduceToSingleFieldName(simpleFieldName)
      expect(result).toBe('someField')
    })

    it('should be able to handle a function call with two field names (not an array)', function() {
      var simpleFieldName = "func('someField', 'otherField')"
      var result = ersaTableAddFilters._testonly.reduceToSingleFieldName(simpleFieldName)
      expect(result).toBe('someField')
    })

    it('should be able to handle a function call with an array', function() {
      var simpleFieldName = "func(['someField', 'otherField'])"
      var result = ersaTableAddFilters._testonly.reduceToSingleFieldName(simpleFieldName)
      expect(result).toBe('someField')
    })
  })
})
