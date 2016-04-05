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
                var url = name;
                var template = "template" + name + ".html";
                var controller = details[1] + "Controller";

                $stateProvider.state(name, { url: url, templateUrl: template, controller: controller });
            }
        }
    };
});
