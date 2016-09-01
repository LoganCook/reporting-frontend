// CRM data
'use strict';

define(['app', '../util'], function(app, util) { 

    /* global _ */
        
  // Get a tenant at a time and save it for later use
  app.factory('crm', function(queryResource, $q) {
    var cachedUseres = {}, cachedCrmNectar = {};  
    
    function getOrganisationUseres(organisations) { 
        var deferred = $q.defer();  

        var  queryies = [];
        organisations.forEach(function(organisation) {
            queryies.push(getUseres(organisation.pk));
        });                
        
        $q.all(queryies).then(function() {
            var buff = {};
            organisations.forEach(function(organisation) { 
                angular.extend(buff, cachedUseres[organisation.pk]); 
            });  
            cachedUseres = _.values(buff); 
            cachedUseres = util.keyArray(cachedUseres, 'personid');   
    
            console.log('cachedUseres==' + JSON.stringify(cachedUseres)); 
            
            deferred.resolve(cachedUseres); 
        }, function(rsp) { 
            alert("Request failed");
            console.log(rsp);
            deferred.reject(cachedUseres);
        });         
        return deferred.promise;
    } 
    
    
    function getUseres(organisationId) { 
        var deferred = $q.defer(); 

        if (organisationId in cachedUseres) {  
            deferred.resolve(cachedUseres[organisationId]); 
        } else {  
            var requestUri = sessionStorage['bman'] + '/api/Organisation'; 
            
            var args = {
                id : organisationId,
                method: 'get_extented_accounts'
            };  
            
            var nq = queryResource.build(requestUri);
            nq.getNoHeader(args, function(details) { 

                console.log('getUseres==' + JSON.stringify(details)); 
                cachedUseres[organisationId] = details; 
            
                deferred.resolve(cachedUseres[organisationId]);
            }, function(rsp) { 
                alert("Request failed");
                console.log(rsp);
                deferred.reject(cachedUseres[organisationId]);
            });            
        }       
        
        return deferred.promise;
    } 
    

    /** 
     * request tenant bulk data from CRM.
     *  
     * @return {Object} $q.defer 
     */ 
    function getRoles() { 
        var deferred = $q.defer(); 
        
        var args = { 
            //method: 'get_all_services'
        }; 

        var requestUri = sessionStorage['bman'] + '/api/Role';   
        //var requestUri = sessionStorage['bman'] + '/api/Account';   
        var nq = queryResource.build(requestUri);
        nq.queryNoHeader(args, function(details) { 

            angular.forEach(details, function(role) {
                if (role.fields.person in cachedUseres) { 
                    cachedUseres[role.fields.person].contractor = role.pk;  
                }  
            });       

            console.log('getRoles==' + JSON.stringify(cachedUseres));
            
            deferred.resolve(cachedUseres); 
        }, function(rsp) { 
            alert("Request failed");
            console.log(rsp);
            deferred.reject(cachedUseres);
        });
        
        return deferred.promise;
    }  
    

    
    /** 
     * request tenant bulk data from CRM.
     *  
     * @return {Object} $q.defer 
     */ 
    function getNectar() { 
        var deferred = $q.defer(); 
        
        if (!_.isEmpty(cachedCrmNectar)) {  
            deferred.resolve(cachedCrmNectar); 
        } else { 
            var args = { 
                //count: 1000000
            }; 
            
            var requestUri = sessionStorage['bman'] + '/api/Nectar';   
            var nq = queryResource.build(requestUri);
            nq.queryNoHeader(args, function(details) { 

                cachedUseres = _.values(cachedUseres); 
                cachedUseres = util.keyArray(cachedUseres, 'contractor');  
                var tempCrmNectar = [];
                angular.forEach(details, function(nectar) {
                    tempCrmNectar.push(nectar.fields);   
                }); 
                                
                tempCrmNectar = util.keyArray(tempCrmNectar, 'tennant_id');  

                for (var tennantId in tempCrmNectar) {
                    var contractorId = tempCrmNectar[tennantId].contractor;
                    if (contractorId && cachedUseres[contractorId]) { 
                        tempCrmNectar[tennantId].fullname = cachedUseres[contractorId].fullname; 
                        tempCrmNectar[tennantId].organisation = cachedUseres[contractorId].organisation; 
                        tempCrmNectar[tennantId].email = cachedUseres[contractorId].email;
                    }
                }
                
                console.log('getNectar==' + JSON.stringify(tempCrmNectar));  
                            
                cachedCrmNectar = tempCrmNectar;
                deferred.resolve(cachedCrmNectar); 
            }, function(rsp) { 
                alert("Request failed");
                console.log(rsp);
                deferred.reject(cachedCrmNectar);
            });                      
        } 
        return deferred.promise;
    }  

    return {
        getNectarUsers: function() {
            var deferred = $q.defer();  

            if (!_.isEmpty(cachedCrmNectar)) {  
                deferred.resolve(cachedCrmNectar); 
            } else {       
                var requestUri = sessionStorage['bman'] + '/api/Organisation'; 
                
                var args = {  
                    method: 'get_tops'
                };   
                var nq = queryResource.build(requestUri);
                nq.queryNoHeader(args, function(organisations) {   
                    getOrganisationUseres(organisations)
                    .then(getRoles)
                    .then(getNectar)
                    .then(function() {
                        
                        deferred.resolve(cachedCrmNectar); 
                    });  
                }, function(rsp) { 
                    alert("Request failed");
                    console.log(rsp);
                    deferred.reject(cachedCrmNectar);
                });          
            }        
            return deferred.promise;
        },
        getUsers: function() { 
            var deferred = $q.defer();  

            if (!_.isEmpty(cachedUseres)) {  
                deferred.resolve(cachedUseres); 
            } else {       
                var requestUri = sessionStorage['bman'] + '/api/Organisation'; 
                
                var args = {  
                    method: 'get_tops'
                };   
                var nq = queryResource.build(requestUri);
                nq.queryNoHeader(args, function(organisations) {   
                    getOrganisationUseres(organisations) 
                    .then(function() { 
                        deferred.resolve(cachedUseres); 
                    });  
                }, function(rsp) { 
                    alert("Request failed");
                    console.log(rsp);
                    deferred.reject(cachedUseres);
                });          
            }        
            return deferred.promise;
        }
    };
  });

});
