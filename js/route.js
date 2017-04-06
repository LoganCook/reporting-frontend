define(["menu-data"], function (menuAllData) {
  return function ($stateProvider, $urlRouterProvider, AuthServiceProvider) {
    $urlRouterProvider.otherwise("/");

    function resolveOrgs($q, org, AuthService, spinner) {
      spinner.start()
      var deferred = $q.defer()
      var finishedSuccess = function() {
        spinner.stop()
        deferred.resolve()
      }
      var finishedFailure = function(reason) {
        spinner.stop()
        var message = 'Failed to load organisation data, cannot continue without it. '
          + 'You can try to reload the page but if it fails again, the problem is with the other server.'
        deferred.reject({
          msgForUi: message,
          reason: reason
        })
      }
      var isLoadAllOrgsAndAccounts = AuthService.isAdmin()
      if (isLoadAllOrgsAndAccounts) {
        org.getOrganisations(isLoadAllOrgsAndAccounts).then(finishedSuccess, finishedFailure)
        return deferred.promise
      }
      org.getOrganisations(isLoadAllOrgsAndAccounts).then(function () {
        org.getUsersOf(org.getOrganisationId(AuthService.getUserOrgName())).then(finishedSuccess, finishedFailure)
      })
      return deferred.promise
    }

    $stateProvider.state("home", {
      url: "/",
      templateUrl: "template/home.html",
      resolve: {
        orgData: resolveOrgs
      }
    }).state("errorreport", {
      templateUrl: "template/errorreport.html",
      resolve: {
        errorDetails: function() {
          return this.self.runtimeErrorDetails
        }
      },
      controller: function($scope, errorDetails) {
        if (errorDetails && errorDetails.msgForUi) {
          $scope.errorMessage = errorDetails.msgForUi
        } else {
          $scope.errorMessage = '(No details provided)'
        }
        $scope.allDetails = JSON.stringify(errorDetails)
      }
    })

    var menuData = {};
    // angular.config only inject providers, so we have to get the instance ourselves
    var AuthService = AuthServiceProvider.$get();
    if (AuthService.isAdmin()) {
      menuData = menuAllData.ersa;
    } else {
      menuData = menuAllData.portal;
    }
    for (var menu in menuData) {
      for (var item in menuData[menu]) {

        var details = menuData[menu][item];

        if (angular.isArray(details)) {
          var name = details[0]; // it is path, state name
          // This is a temporary solution to allow components and controllers co-exist
          // Component branch, now we have only one component.
          if (name == '/nova') {
            $stateProvider.state('/nova', {
              url: '/nova',
              template: '<nova></nova>',
              admined: true
            });
          } else {
            // FIXME: these so called external urls have to be moved into index.html: they are not mananaged states
            if (name.startsWith('http')) continue; //external url

            // controller branch
            var url = name;
            var template = "template" + name + ".html"; // /admin does not work here yet because there is no template
            var controller = details[1] + "Controller";
            var locked = name.startsWith('/admin') ? true : false;

            $stateProvider.state(name, {
              url: url,
              templateUrl: template,
              controller: controller,
              admined: locked,
              resolve: { // could use an abstract root view that does the resolve for all children but this way doesn't involve hacking state names
                orgData: resolveOrgs
              }
            });
          }
        }
      }
    }
  };
});