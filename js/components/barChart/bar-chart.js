/*global d3:true dc:true crossfilter:true*/
define(['pageComponents'], function (module) {
  'use strict';

  function getNames(dimension) {
    return dimension.group().all().map(item => item.key);
  }

  // function unique(array, propertyName) {
  //   return array.filter((e, i) => array.findIndex(a => a[propertyName] === e[propertyName]) === i);
  // }
  function unique(array, propertyName) {
    let uniques = [];
    array.forEach(function(element) {
      if (uniques.indexOf(element[propertyName]) === -1) {
        uniques.push(element[propertyName]);
      }
    });
    return uniques;
  }

  function selectStack(valueKey) {
    return function (d) {
      return d.value[valueKey];
    };
  }

  module.component('ersaBarChart', {
    // bar chart for displaying fees
    templateUrl: 'js/components/barChart/bar-chart.html',
    controller: function ChartController($scope, $element, $attrs) {
      let ctrl = this;
      let mainChartWidth = ctrl.ersaChartWidth || 780, mainChartHeight = ctrl.ersaChartHeight || 480;
      if (angular.isUndefined(ctrl.ersaChartDimensionKey)) {
        throw new Error('Missing ersa-chart-dimension-key');
      }
      const chartXTypes = ['ordinal', 'datetime'];
      let chartXType = ctrl.ersaChartXType || 'ordinal';  // either datetime or ordinal
      if (chartXTypes.indexOf(chartXType) == -1) {
        throw new Error(chartXType + ': not supported x axis type, has to be one of "ordinal", "datetime"');
      }

      // is there a way to convert current $element to d3 selector? then we don't need id
      let anchorElement = d3.select("#" + $element.attr('id'));
      let chart = dc.barChart(anchorElement.select('.ersa-chart'));

      let ndx = crossfilter(ctrl.ersaChartData), dataDimension, dimensionGroup;
      let productDimension = ndx.dimension(function (d) { return d.product; });

      if (chartXType === 'ordinal') { // ordinal dimension
        dataDimension = ndx.dimension(function (d) {
            return d[ctrl.ersaChartDimensionKey];
        });
        chart.x(d3.scaleBand().domain(getNames(dataDimension)))
          .xUnits(dc.units.ordinal)
          .xAxisLabel(ctrl.ersaChartDimensionKey.charAt(0).toUpperCase() + ctrl.ersaChartDimensionKey.substr(1));
      } else { // datetime dimension
        dataDimension = ndx.dimension(function(d) {return d3.timeMonth(d['startDate']);});
        chart.x(d3.scaleTime())
          .xUnits(d3.timeMonths).xAxisLabel("Date");
      }

      if (ctrl.ersaChartGroupKey) {
        // this is a stacked bar chart
        dimensionGroup = dataDimension.group().reduce(function (p, v) {
          p[v[ctrl.ersaChartGroupKey]] = (p[v[ctrl.ersaChartGroupKey]] || 0) + v['totalAmount'];
          return p;
        }, function (p, v) {
          p[v[ctrl.ersaChartGroupKey]] = (p[v[ctrl.ersaChartGroupKey]] || 0) - v['totalAmount'];
          return p;
        }, function () {
          return {};
        });
      } else {
        dimensionGroup = dataDimension.group().reduceSum(function(d) {return d['totalAmount'];});
      }

      chart.width(mainChartWidth)
        .height(mainChartHeight)
        .elasticX(true)
        .brushOn(false)
        .yAxisLabel("Fee")
        .elasticY(true)
        .dimension(dataDimension);
      if (ctrl.ersaChartGroupKey) {
        let groups = unique(ctrl.ersaChartData, ctrl.ersaChartGroupKey);
        chart.legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
          .group(dimensionGroup, groups[0], selectStack(groups[0]));

        for (let i = 1; i < groups.length; ++i) {
          chart.stack(dimensionGroup, groups[i], selectStack(groups[i]));
        }
        let filterSelect = dc.selectMenu(anchorElement.select('.ersa-chart-filter'));
        filterSelect.dimension(productDimension)
          .group(productDimension.group())
          .numberVisible(10)
          .controlsUseVisibility(true);
        filterSelect.render();
      } else {
        chart.group(dimensionGroup);
      }

      chart.yAxis().tickFormat(d3.format('.3s'));
      chart.margins().left += 15;

      chart.render();
      if (chartXType === 'ordinal') {
        chart.on("renderlet", function (chartObj) {
          // rotate x-axis labels, this certainly depends font size
          chartObj.selectAll('g.x text')
            .attr('transform', 'translate(-15,-150) rotate(-90)');
        });
      }
    },
    bindings: {
      ersaChartData: '<',
      ersaChartDimensionKey: '@',  // above are required
      ersaChartTitle: '@',   // below are optional, but as we do not change binding in component, no ?
      ersaChartHeight: '<',
      ersaChartWidth: '<',
      ersaChartGroupKey: '@',
      ersaChartXType: '@'
    }
  });
});
