define(["menu-data"], function (menuAllData) {
  return function ($stateProvider, $urlRouterProvider, AuthServiceProvider) {
    $urlRouterProvider.otherwise("/");

    $stateProvider.state("home", {
      url: "/",
      templateUrl: "template/home.html"
    });

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
              admined: locked
            });
          }
        }
      }
    }
  };
});