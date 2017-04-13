describe('BlankSafe directive', function() {
  var $compile
  var $rootScope

  beforeEach(module('reportingApp'))

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_
    $rootScope = _$rootScope_
  }))

  it('can replace a blank value with the placeholder', function() {
    var element = $compile('<span blank-safe="someValue"></safe>')($rootScope)
    $rootScope.$digest()
    expect(element.html()).toBe('<span class="blank-value">(no value)</span>')
  })

  it('can use the supplied value when it is not blank', function() {
    $rootScope.someValue = 'super wombat'
    var element = $compile('<span blank-safe="someValue"></safe>')($rootScope)
    $rootScope.$digest()
    expect(element.html()).toBe('<span>super wombat</span>')
  })

  it('can update the value as it changes', function() {
    $rootScope.someValue = 'super wombat'
    var element = $compile('<span blank-safe="someValue"></safe>')($rootScope)
    $rootScope.$digest()
    expect(element.html()).toBe('<span>super wombat</span>')
    $rootScope.someValue = 'awesome giraffe'
    element = $compile('<span blank-safe="someValue"></safe>')($rootScope)
    $rootScope.$digest()
    expect(element.html()).toBe('<span>awesome giraffe</span>')
  })
})
