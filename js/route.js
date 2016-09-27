define(["menu-data"], function(menuAllData) {
    return function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/");

        $stateProvider.state("home", {
            url: "/",
            templateUrl: "template/home.html"
        });
        
        sessionStorage['ersaUser'] = 'false'; 
        
        var menuData = {};
         
        if(sessionStorage['ersaUser'] === 'true'){
            menuData = menuAllData.ersa; 
        }else{
            menuData = menuAllData.portal; 
        } 
        
        for (var menu in menuData) {
            for (var item in menuData[menu]) {
                
                var details = menuData[menu][item];
                console.log("details="  + details);
                if( angular.isArray(details)){ 
                    var name = details[0]; 
                    // This is a temporary solution until menu items and the states
                    // they represent have been rewirtten.
                    if (name == '/nova') continue;
                    if( name.startsWith('http'))continue;//external url
                    
                    var url = name;
                    var template = "template" + name + ".html";
                    var controller = details[1] + "Controller";  
                    
                    $stateProvider.state(name, { url: url, templateUrl: template, controller: controller });
                }else{// some portal url does not include submenu 
                    
                }
            }
        }

        $stateProvider.state('/nova', { url: '/nova', template: '<nova></nova>'});
    };
});
