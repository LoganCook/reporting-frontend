define(['pageComponents', 'dc'], function (module, dc) {
  'use strict'
  var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  module.component('ersaStackedAreaChart', {
    templateUrl: 'js/components/ersaStackedAreaChart/ersa-stacked-area-chart.html',
    controller: ['$scope', controller],
    bindings: {
      // mandatory
      esacData: '=', // [{}]
      esacYAxisLabel: '=', // string - label for Y axis
      esacFilterField: '=', // string - name of field to filter on
      esacValueField: '=', // string - name of field with value
      esacWidth: '=', // number - pixels of width
      esacHeight: '=', // number - pixels of height
      esacAllFilterLabel: '=', // string - label for 'All' in filter
      // optional
      esacIsElasticY: '=' // boolean - default true
    }
  })

  function controller ($scope) {
    var records = $scope.$ctrl.esacData
    var filterField = $scope.$ctrl.esacFilterField
    var valueField = $scope.$ctrl.esacValueField
    $scope.allFilterLabel = $scope.$ctrl.esacAllFilterLabel
    var uniqueFilterValues = records.reduce(function (prev, curr) {
      if (prev.indexOf(curr[filterField]) >= 0) {
        return prev
      }
      prev.push(curr[filterField])
      return prev
    }, [])
    var ndx = crossfilter(records)
    $scope.monthDimension = ndx.dimension(function (d) {
      return d.month
    })
    $scope.filterDimension = ndx.dimension(function (d) {
      return d[filterField]
    })
    $scope.filterChartPostSetup = function (theFilter, _) {
      var filterContainer = angular.element(theFilter.anchor())
      var selectElement = filterContainer.children('select')
      selectElement.addClass('form-control')
    }
    $scope.stackedAreaChartPostSetup = function (theChart, _) {
      theChart.xAxis().tickFormat(function (v) {
        return months[v]
      })
      var isFirst = true
      uniqueFilterValues.forEach(function (curr) {
        var group = $scope.monthDimension.group()
        .reduce(function (p, v) {
          if (v[filterField] !== curr) {
            return p
          }
          return p + v[valueField]
        }, function (p, v) {
          if (v[filterField] !== curr) {
            return p
          }
          return p - v[valueField]
        }, function () { return 0 })
        if (isFirst) {
          isFirst = false
          theChart.group(group, curr)
          return
        }
        theChart.stack(group, curr)
      })
      theChart.yAxis().tickFormat(function (v) { return (v / 1000) + 'k' })
      var isElasticY = true
      if ($scope.$ctrl.esacIsElasticY === false) {
        isElasticY = false
      }
      var dotRadius = 5
      theChart.renderDataPoints({
        fillOpacity: 0.8,
        strokeOpacity: 0.8,
        radius: dotRadius
      }).dotRadius(dotRadius * 1.4)
      theChart.elasticY(isElasticY)
      theChart.title(function (d) {
        return months[d.key] + '=' + d.value // TODO#56 get tooltips showing for any filter value (currently obscured)
      })
      // theChart.svg() // TODO#56 get title showing
      //   .append('text')
      //   .attr('text-anchor', 'middle')
      //   .attr('x', theChart.width() / 2)
      //   .attr('y', 22)
      //   .text('TODO title') // TODO#56 add title param
      // theChart.render()
    }
    $scope.legend = dc.legend().x(70).y(10).itemHeight(13).gap(5)
  }
})
