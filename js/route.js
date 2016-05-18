define(["menu-data"], function(menuData) {
    return function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/");

        $stateProvider.state("home", {
            url: "/",
            templateUrl: "template/home.html"
        });

        for (var menu in menuData) {
            for (var item in menuData[menu]) {
                var details = menuData[menu][item];

                var name = details[0];
                // This is a temporary solution until menu items and the states
                // they represent have been rewirtten.
                if (name == 'nova') continue;
                var url = name;
                var template = "template" + name + ".html";
                var controller = details[1] + "Controller";

                $stateProvider.state(name, { url: url, templateUrl: template, controller: controller });
            }
        }

        $stateProvider.state('nova', { url: '/nova', template: '<nova></nova>'});
    };
});
