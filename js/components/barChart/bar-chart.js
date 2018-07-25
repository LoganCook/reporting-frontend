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
    templateUrl: 'js/components/barChart/bar-chart.html',
    controller: function ChartController($scope, $element, $attrs) {
      let ctrl = this;
      let mainChartWidth = ctrl.ersaChartWidth || 780, mainChartHeight = ctrl.ersaChartHeight || 480;

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
        accountDimension = ndx.dimension(function (d) {
            return d.account;
          }),
          accountFeeGroup = accountDimension.group().reduceSum(function (d) {
            return d.totalAmount;
          }),
          unitDimension = ndx.dimension(function (d) {
            return d.unit;
          }),
          unitFeeGroup = unitDimension.group().reduceSum(function (d) {
            return d.totalAmount;
          });

        var accountFeeGroupSum = accountDimension.group().reduce(function (p, v) {
          p[v['product']] = (p[v['product']] || 0) + v['totalAmount'];
          return p;
        }, function (p, v) {
          p[v['product']] = (p[v['product']] || 0) - v['totalAmount'];
          return p;
        }, function () {
          return {};
        });

        var xTicks = getNames(accountDimension);

        ngxexposed = ndx; //FIXME: remove when done

        var products = unique(fee, 'product');
        console.log(products);

        chart.width(mainChartWidth)
          .height(mainChartHeight)
          .x(d3.scaleBand().domain(xTicks))
          .xUnits(dc.units.ordinal)
          .elasticX(true)
          .brushOn(false)
          .yAxisLabel("Fee")
          .elasticY(true)
          .xAxisLabel("Account")
          .dimension(accountDimension)
          .group(accountFeeGroupSum, products[0], sel_stack(products[0]))
          .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5));
        for(var i = 1; i<products.length; ++i)
          chart.stack(accountFeeGroupSum, products[i], sel_stack(products[i]));
        chart.render();
        chart.on("renderlet", function (chart) {
          // rotate x-axis labels
          chart.selectAll('g.x text')
            .attr('transform', 'translate(-10,-100) rotate(-90)');
        });

        var filterSelect = dc.selectMenu(anchorElement.select('.ersa-chart-filter'));
        filterSelect.dimension(productDimension)
        .group(productDimension.group())
        .numberVisible(10)
        .controlsUseVisibility(true);
        filterSelect.render();
      });
    },
    bindings: {
      ersaChartTitle: '@',
      ersaChartHeight: '<',
      ersaChartWidth: '<'
    }
  });
});
