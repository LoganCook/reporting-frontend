define(
  ["client", "datePickers", "ersaTable", "ersaTableSort", "blankSafe", "userRollupErrors"],
  function (clientConstructor) {

  var app = angular.module("reportingApp", ["ngSanitize", "ui.router", "ui.bootstrap", "ngResource",
    "angularSpinner", "pageComponents", "ngTableToCsv", "smart-table"]);
  app.factory("reporting", ["$timeout", "queryResource", clientConstructor]);
  app
    // .config(['$resourceProvider', function ($resourceProvider) {
    //   // Don't strip trailing slashes from calculated URLs to make Django URLs work
    //   $resourceProvider.defaults.stripTrailingSlashes = false;
    // }])
    .run(function ($rootScope, $state, AuthService) {
      $rootScope.$on("$stateChangeStart", function(event, toState) {
        if (toState.admined && !AuthService.isAdmin()) {
          $state.transitionTo("/");
          event.preventDefault();
        }
      });
    })
    // cannot do global headers.common: it messes up bman CROS
    // .run(function($http) {$http.defaults.headers.common["x-ersa-auth-token"] = sessionStorage["secret"]})
  ;

  //Global search form for all pages
  app.directive('ersaSearch', function () {
    return {
      restrict: "AE",
      controller: function ($scope, $element, $attrs) {

        $scope.dateOptions = {
          //dateDisabled: true,
          maxDate: new Date()
        };

        /**
         * Initialize start and end data.
         * Each controller can still set up start and end date.
         */
        if (!angular.isDefined($scope.load)) {
          alert('load function is not defined ..');
        }

        if (!angular.isDefined($scope.rangeStart)) {
          var startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          $scope.rangeStart = startDate;
        }

        if (!angular.isDefined($scope.rangeEnd)) {
          $scope.rangeEnd = new Date();
        }

        if (!angular.isDefined($scope.openRangeStart)) {
          $scope.rangeStartOpen = false;
          $scope.openRangeStart = function () {
            $scope.rangeStartOpen = true;
          };
        }

        if (!angular.isDefined($scope.openRangeEnd)) {
          $scope.rangeEndOpen = false;
          $scope.openRangeEnd = function () {
            $scope.rangeEndOpen = true;
          };
        }

        if (angular.isDefined($attrs.startDateClass)) {
          $scope.startDateClassName = $attrs.startDateClass;
        }
        if (angular.isDefined($attrs.endDateClass)) {
          $scope.endDateClassName = $attrs.endDateClass;
        }
        if (angular.isDefined($attrs.buttonClass)) {
          $scope.buttonClassName = $attrs.buttonClass;
        }


        /**
         * start Util fuctions
         */
        var getSearchDateFilter = function (scope) {

          if (scope.rangeStart > scope.rangeEnd) {
            scope.alerts.push({
              type: 'danger',
              msg: "Date options is invalid!"
            });
            return '';
          }

          var rangeStartEpoch = dayStart(scope.rangeStart);
          var rangeEndEpoch = dayEnd(scope.rangeEnd);
          var filter = {
            filter: [
              "end.ge." + rangeStartEpoch,
              "end.lt." + rangeEndEpoch
            ]
          };
          return filter;
        };

        // FIXME: are there any differences between dayStart and dayEnd here and those in util.js?
        var dayStart = function (ts) {
          var modified = new Date(ts);

          modified.setHours(0);
          modified.setMinutes(0);
          modified.setSeconds(0);
          modified.setMilliseconds(0);

          return Math.round(modified.getTime() / 1000);
        };

        var dayEnd = function (ts) {
          var modified = new Date(ts);

          modified.setHours(23);
          modified.setMinutes(59);
          modified.setSeconds(59);
          modified.setMilliseconds(999);

          return Math.round(modified.getTime() / 1000);
        };

        /**
         * end Util fuctions
         */

        /**
         * Wrapping functions
         */
        $scope._load = function () {
          var rangeEpochFilter = getSearchDateFilter($scope);
          if (rangeEpochFilter == '') {
            return;
          }

          // FIXME: nova.js load has its own rangeEpochFilter
          $scope.load(rangeEpochFilter);
        };
      },
      replace: true,
      templateUrl: 'template/directives/ersa-search.html'
    };
  });


  app.factory("queryResource", ["$resource", function ($resource) {
    return {
      build: function (url) {
        //
        // By default, only suppport object query
        // pattern = pattern ? pattern : '/:object/:id/:method';
        //return $resource(url + '/:object', {count:3},
        return $resource(url + '/:object/:id/:method', {}, {
          'get': {
            method: 'GET',
            headers: {
              "x-ersa-auth-token": sessionStorage["secret"]
            }
          },
          'getNoHeader': {
            method: 'GET'
          },
          'query': {
            method: 'GET',
            isArray: true,
            headers: {
              "x-ersa-auth-token": sessionStorage["secret"]
            }
          },
          'queryNoHeader': {
            method: 'GET',
            isArray: true
          },
          'post': {
            method: 'POST',
            isArray: true,
            headers: {
              "x-ersa-auth-token": sessionStorage["secret"],
              "Content-Type": "application/x-www-form-urlencoded",
              "Access-Control-Request-Method": "POST"
            }
          }
        });
      }
    };
  }]).factory("spinner", ["usSpinnerService", function (usSpinnerService) {
    return {
      start: function () {
        usSpinnerService.spin("main-spinner");
      },
      stop: function () {
        usSpinnerService.stop("main-spinner");
      }
    };
  }]);

  function buildTheConstants() {
    var subTotal = 'Grand'
    /**
     * A comparator for ensuring that the sub-total row comes last.
     * @param {{organisation: string}} v1 - first object
     * @param {{organisation: string}} v2 - second object
     * @return {int} sort order the ensures sub-total row comes last but is indifferent to everything else
     */
    function orderBySubTotalLast(v1, v2) {
      if (v1.organisation === subTotal) {
        return 1
      }
      return 0
    }
    function orderByPredicateThenSubTotal (predicate) {
      return (value) => {
        var subtotalFieldName = 'organisation'
        var result = value[predicate]
        var subtotalFieldValue = value[subtotalFieldName]
        if (subtotalFieldValue === subTotal) {
          return result + '~'
        }
        return result + subtotalFieldValue
      }
    }
    function orderByTwoCols (col1, col2) {
      return orderByNCols([col1, col2])
    }
    function orderByNCols (colNameArray) {
      return (value) => {
        var orderValue = ''
        for (var i = 0; i < colNameArray.length; i++) {
          var fieldName = colNameArray[i]
          var fieldValue = value[fieldName]
          if (typeof fieldValue === 'undefined') {
            orderValue += '~'
            continue
          }
          orderValue += fieldValue
        }
        return orderValue
      }
    }
    function isFilterApplied (displayed, raw) {
      return displayed && raw && displayed.length !== raw.length
    }
    return {
      grandTotal: 'Grand Total',
      subTotal: subTotal,
      blankValue: '_blank_value_',
      isSubTotalRow: function(entry) {
        return entry.organisation && entry.organisation === subTotal
      },
      orderBySubTotalLast: orderBySubTotalLast,
      orderByPredicateThenSubTotal: orderByPredicateThenSubTotal,
      orderByTwoCols: orderByTwoCols,
      isFilterApplied: isFilterApplied,
      orderByNCols: orderByNCols
    }
  }

  app.constant('theConstants', buildTheConstants())

  app.directive('cellRatio', function () {
    return {
      link: function (scope, element, attr) {
        var ratio = +(attr.cellRatio)
        element.css('width', ratio + '%')
      }
    }
  })

  return app;
});