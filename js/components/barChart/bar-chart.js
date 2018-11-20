/*global d3:true dc:true crossfilter:true*/
define(
  ['pageComponents', 'app', 'properties'],
  function (module, app, props) {
  'use strict';

  console.log(app);

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

  function currency(num) {
    return "$" + Math.round(num).toLocaleString();
  }

  function jsToUnixTime(time) {
    return Math.floor(time / 1000);
  }

  function updateData(ctrl, element, routeScope) {
    ctrl.ersaChartData = routeScope.chartData;  // FIXME: Should not have to do this if binding?

    // FIXME: Demo filter for schools (client side).
    if (sessionStorage['email'].endsWith("@ersa.edu.au")) {
      ctrl.ersaChartData = ctrl.ersaChartData.filter(function(data) {
        if (ctrl.ersaChartUnit == null) {

          // Remove schools from institution level.
          for (let i = 0; i < props["chart"]["blacklist"].length; i++) {
            if (data['account'] === props["chart"]["blacklist"][i]) {
              return false;
            }
          }
          return true;
        }
        let filter = ctrl.ersaChartUnit == data['account'];
        return filter;
      });
    }

    // FIXME: Workaround for not showing last bar data. Works by adding "empty" data to the next month.
    if (ctrl.ersaChartData.length > 0) {
      let dateHack = 0;
      for (let i = 0; i < ctrl.ersaChartData.length; i++) {
        dateHack = Math.max(dateHack, ctrl.ersaChartData[i].startDate);
      }
      dateHack = new Date(dateHack);
      dateHack.setMonth(dateHack.getMonth() + 1);
      let pointHack = {
        account: ctrl.ersaChartData[0].account,
        end: -1,
        product: ctrl.ersaChartData[0].product,
        start: -1,
        startDate: dateHack,
        totalAmount: 0,
        unit: ctrl.ersaChartData[0].unit
      };
      ctrl.ersaChartData.push(pointHack);
    }

    // Create the chart.
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
    let anchorElement = d3.select("#" + element.attr('id'));
    let chart = dc.barChart(anchorElement.select('.ersa-chart'));

    chart.round(function(n) { return -n; });

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
        .xUnits(d3.timeMonths)
        .xAxisLabel("Date");
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
      .yAxisLabel("Fee ($)")
      .title(function(d) {  // Tooltip.
        let tip = "";
        let total = 0;

        // Heading.
        if (ctrl.ersaChartXType === 'datetime') {
          let date = new Date(d.key).toLocaleString("en-AU", { month: "long" }) + " " + new Date(d.key).getFullYear();
          tip = date + "\n";  // Title is the date.
        } else {
          tip = d.key + "\n"; // Title is the account name.
        }
        let lineBreak = true;

        // Subtotals.
        let subTotals = [];
        for (var key in d['value']) {
          if (lineBreak) {
            tip += "\n";
            lineBreak = false;
          }
          let cost = d['value'][key]; // Cost can go '-0.0'.
          if (cost.toFixed(2) != 0) {
            subTotals.push(key + ": " + currency(cost));
          }
          total += d['value'][key];
        }
        subTotals.sort();
        tip += subTotals.join("\n");


        // Total.
        if (subTotals.length >= 2) {
          tip += "\n\nTotal: " + currency(total);
        }
        return tip;
      })
      .elasticY(true)
      .ordinalColors(['#f36339','#008ea1','#faa431'])
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
        .promptText('Select All Services')
        .filterDisplayed(function() {
          return true;
        })
        .title(function(d) {
          // return d.key + " (DEBUG " + d.value + " points)";
          return d.key;
        })
        .controlsUseVisibility(true);
      filterSelect.render();
    } else {
      chart.group(dimensionGroup);
    }

    chart.yAxis().tickFormat(d3.format('.3s'));
    chart.margins().left += 15;

    // Make the legends appear the same order as the stack.
    dc.override(chart, 'legendables', function() {
      return chart._legendables().reverse();
    });

    if (chartXType === 'ordinal') {
      chart.on("renderlet", function (chartObj) {
        // rotate x-axis labels, this certainly depends font size
        chartObj.selectAll('g.x text')
          .attr('transform', 'translate(-15,-150) rotate(-90)');
      });
    } else {
      // Prevent too many ticks (i.e. for single month).
      chart.xAxis().ticks(Math.min(12, chart.group().all().length));
    }

    chart.render();
  }

  module.component('ersaBarChart', {
    // bar chart for displaying fees
    templateUrl: 'js/components/barChart/bar-chart.html',
    controller: function ChartController($scope, $element, $attrs) {
      let ctrl = this;

      ctrl.updateData = function(routeScope) {
        updateData(ctrl, $element, routeScope);
        console.log("Update", ctrl);
      }

      // FIXME: How to avoid using scope for telling graphs apart and updating them?
      if ($scope.$ctrl.ersaChartXType !== 'datetime') {
        $scope.$parent.chartScopes.push($scope);
      }

      ctrl.updateData($scope.$parent); // First draw.
    },
    bindings: {
      ersaChartData: '<',
      ersaChartDimensionKey: '@',  // above are required
      ersaChartTitle: '@',   // below are optional, but as we do not change binding in component, no ?
      ersaChartHeight: '<',
      ersaChartWidth: '<',
      ersaChartGroupKey: '@',
      ersaChartXType: '@',
      ersaChartUnit: '@'
    }
  });
});
