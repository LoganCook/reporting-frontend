define(['pageComponents', 'dc'], function (module, dc) {
  'use strict'
  var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  module.component('ersaStackedBarChart', {
    templateUrl: 'js/components/ersaStackedBarChart/ersa-stacked-bar-chart.html',
    controller: ['$scope', controller],
    bindings: {
      // mandatory
      esbcData: '=', // [{}]
      esbcYAxisLabel: '=', // string - label for Y axis
      esbcFilterField: '=', // string - name of field to filter on
      esbcValueField: '=', // string - name of field with value
      esbcWidth: '=', // number - pixels of width
      esbcHeight: '=', // number - pixels of height
      esbcAllFilterLabel: '=', // string - label for 'All' in filter
      // optional
      esbcIsElasticY: '=', // boolean - default true
      esbcTitle: '=' // string - title for the chart
    }
  })

  function controller ($scope) {
    var records = $scope.$ctrl.esbcData
    var filterField = $scope.$ctrl.esbcFilterField
    var valueField = $scope.$ctrl.esbcValueField
    $scope.allFilterLabel = $scope.$ctrl.esbcAllFilterLabel
    $scope.chartTitle = $scope.$ctrl.esbcTitle
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
    $scope.filterTitleFn = function (d) {
      return d.key
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
          var value = v[valueField] || 0
          return p + value
        }, function (p, v) {
          if (v[filterField] !== curr) {
            return p
          }
          var value = v[valueField] || 0
          return p - value
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
      if ($scope.$ctrl.esbcIsElasticY === false) {
        isElasticY = false
      }
      theChart.elasticY(isElasticY)
      theChart.title(function (d) {
        return months[d.key] + '=' + d.value // TODO#56 get tooltips showing for any filter value (currently obscured)
      })
    }
    $scope.legend = dc.legend().x(70).y(10).itemHeight(13).gap(5)
  }
})
