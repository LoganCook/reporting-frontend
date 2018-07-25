var ngxexposed; //FIXME: remove when done
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

  module.component('ersaBarChart', {
    // bar chart for displaying fees
    templateUrl: 'js/components/barChart/bar-chart.html',
    controller: function ChartController($scope, $element, $attrs) {
      let ctrl = this;
      let mainChartWidth = ctrl.ersaChartWidth || 780, mainChartHeight = ctrl.ersaChartHeight || 480;
      if (angular.isUndefined(ctrl.ersaChartDimensionKey)) {
        throw new Error('Missing ersa-chart-dimension-key');
      }

      function sel_stack(valueKey) {
        return function (d) {
          return d.value[valueKey];
        };
      }

      var anchorElement = d3.select("#" + $element.attr('id'));
      var chart = dc.barChart(anchorElement);

      var url = sessionStorage['record'] + '/fee/summary/?start=1451568600&end=1530368999';
      d3.json(url).then(function (fee) {
        var ndx = crossfilter(fee),
          productDimension = ndx.dimension(function (d) {
            return d.product;
          }),
          dataDimension = ndx.dimension(function (d) {
              return d[ctrl.ersaChartDimensionKey];
          });

        let dimensionGroup;
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
          dimensionGroup = dataDimension.group().reduceSum(function(d) {return d['totalAmount']});
        }
        // var accountFeeGroupSum = accountDimension.group().reduce(function (p, v) {
        //   p[v['product']] = (p[v['product']] || 0) + v['totalAmount'];
        //   return p;
        // }, function (p, v) {
        //   p[v['product']] = (p[v['product']] || 0) - v['totalAmount'];
        //   return p;
        // }, function () {
        //   return {};
        // });

        var xTicks = getNames(dataDimension);

        ngxexposed = ndx; //FIXME: remove when done

        chart.width(mainChartWidth)
          .height(mainChartHeight)
          .x(d3.scaleBand().domain(xTicks))
          .xUnits(dc.units.ordinal)
          .elasticX(true)
          .brushOn(false)
          .yAxisLabel("Fee")
          .elasticY(true)
          .xAxisLabel("Account")
          .dimension(dataDimension)
          .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5));
        if (ctrl.ersaChartGroupKey) {
          let groups = unique(fee, ctrl.ersaChartGroupKey);
          console.log(groups);
          chart.group(dimensionGroup, groups[0], sel_stack(groups[0]));
          for(let i = 1; i<groups.length; ++i) {
            chart.stack(dimensionGroup, groups[i], sel_stack(groups[i]));
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
        chart.render();
        chart.on("renderlet", function (chart) {
          // rotate x-axis labels
          chart.selectAll('g.x text')
            .attr('transform', 'translate(-10,-100) rotate(-90)');
        });

      });
    },
    bindings: {
      ersaChartTitle: '@',
      ersaChartHeight: '<',
      ersaChartWidth: '<',
      ersaChartDimensionKey: '@',
      ersaChartGroupKey: '@'
    }
  });
});
