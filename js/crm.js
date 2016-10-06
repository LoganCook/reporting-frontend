// CRM data
'use strict';

define(['app', './util'], function(app, util) { 

    /* global _ */
        
  // Get a tenant at a time and save it for later use
  app.factory('crm', function(queryResource, $q) {
    var organisations = {}, organisationLoggedin = {};
    var cachedUsers = {}, cachedCrmNectar = {};  
    

    function getTopOrganisations() { 
        var deferred = $q.defer();  

        if (!_.isEmpty(organisations)) {  
            deferred.resolve(organisations); 
        } else {       
            var requestUri = sessionStorage['bman'] + '/api/Organisation'; 
            
            var args = {  
                method: 'get_tops'
            };   
            var nq = queryResource.build(requestUri);
            nq.queryNoHeader(args, function(organisations) { 
                deferred.resolve(organisations);    
            }, function(rsp) { 
                //alert("Request failed");
                console.log(rsp);
                deferred.reject(organisations);
            });          
        }        
        return deferred.promise;
    } 
    
        
    function getOrganisationUsers(orgs) { 
        var deferred = $q.defer();  
        organisations = orgs;
        
        var  queryies = [];
        organisations.forEach(function(organisation) {
            queryies.push(getUsers(organisation.pk));
        });                
        
        $q.all(queryies).then(function() {
            deferred.resolve(cachedUsers);  
        }, function(rsp) { 
            //alert("Request failed");
            console.log(rsp);
            deferred.reject(cachedUsers);
        });         
        return deferred.promise;
    } 
    
    
    function getUsers(organisationId) { 
        var deferred = $q.defer(); 

        if (organisationId in cachedUsers) {  
            deferred.resolve(cachedUsers[organisationId]); 
        } else {  
            var requestUri = sessionStorage['bman'] + '/api/Organisation'; 
            
            var args = {
                id : organisationId,
                method: 'get_extented_accounts'
            };  
            
            var nq = queryResource.build(requestUri);
            nq.getNoHeader(args, function(details) {  
                cachedUsers[organisationId] = details;  
                /**
                 * asign billing organisation to top organisation.
                 */
                var userList = _.values(cachedUsers[organisationId]);
                _.forEach(userList, function(user) {
                    if (user.email) {// to avoide error "can't assign to properties of (new Boolean(true)): not an object"
                        user['org'] =  organisationId;
                    }
                    _.forEach(organisations, function(org) {  
                        if (org.pk == user.billing) { 
                            org.billing = user.billing;  
                        }
                    });
                }); 
                
                deferred.resolve(cachedUsers[organisationId]);
            }, function(rsp) { 
                //alert("Request failed");
                console.log(rsp);
                deferred.reject(cachedUsers[organisationId]);
            });            
        }       
        
        return deferred.promise;
    } 
    

    function getCachedUsers() { 
        var deferred = $q.defer();  

        if (!_.isEmpty(cachedUsers)) {  
            deferred.resolve(cachedUsers); 
        } else {       
            getTopOrganisations().then(function(topOrganisations) { 
                getOrganisationUsers(topOrganisations) 
                .then(function() { 
                    deferred.resolve(cachedUsers); 
                });  
            }, function(rsp) { 
                //alert("Request failed");
                console.log(rsp);
                deferred.reject(cachedUsers);
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
        var nq = queryResource.build(requestUri);
        nq.queryNoHeader(args, function(details) { 

            angular.forEach(details, function(role) {
                if (role.fields.person in cachedUsers) { 
                    cachedUsers[role.fields.person].contractor = role.pk;  
                }  
            }); 
            deferred.resolve(cachedUsers); 
        }, function(rsp) { 
            //alert("Request failed");
            console.log(rsp);
            deferred.reject(cachedUsers);
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

                cachedUsers = _.values(cachedUsers); 
                cachedUsers = util.keyArray(cachedUsers, 'contractor');  
                var tempCrmNectar = [];
                angular.forEach(details, function(nectar) {
                    tempCrmNectar.push(nectar.fields);   
                }); 
                                
                tempCrmNectar = util.keyArray(tempCrmNectar, 'tennant_id');  

                for (var tennantId in tempCrmNectar) {
                    var contractorId = tempCrmNectar[tennantId].contractor;
                    if (contractorId && cachedUsers[contractorId]) { 
                        tempCrmNectar[tennantId].fullname = cachedUsers[contractorId].fullname; 
                        tempCrmNectar[tennantId].organisation = cachedUsers[contractorId].organisation; 
                        tempCrmNectar[tennantId].email = cachedUsers[contractorId].email;
                    }
                } 
                cachedCrmNectar = tempCrmNectar;
                deferred.resolve(cachedCrmNectar); 
            }, function(rsp) { 
                //alert("Request failed");
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
                    //alert("Request failed");
                    console.log(rsp);
                    deferred.reject(cachedCrmNectar);
                });          
            }        
            return deferred.promise;
        },
        getUsersByPersonId: function() {// used in Nectar usage 
            var deferred = $q.defer();  

            if (!_.isEmpty(cachedUsers)) {  
                deferred.resolve(cachedUsers); 
            } else {       
                getCachedUsers().then(function(buff) {   
                    var buff = {};
                    organisations.forEach(function(organisation) { 
                        angular.extend(buff, cachedUsers[organisation.pk]); 
                    });  
                    buff = _.values(buff); 
                    buff = util.keyArray(buff, 'personid');       
                    deferred.resolve(buff);  
                }, function(rsp) { 
                    //alert("Request failed");
                    console.log(rsp);
                    deferred.reject(cachedUsers);
                });          
            }        
            return deferred.promise;
        },
        getUsers: function() {// used in HPC 
            var deferred = $q.defer();  

            if (!_.isEmpty(cachedUsers)) {  
                deferred.resolve(cachedUsers); 
            } else {       
                getCachedUsers().then(function(buff) {     
                    deferred.resolve(cachedUsers);  
                }, function(rsp) { 
                    //alert("Request failed");
                    console.log(rsp);
                    deferred.reject(cachedUsers);
                });          
            }        
            return deferred.promise;
        },
        getOrganisations: function() { 
            var deferred = $q.defer();  

            if (!_.isEmpty(organisations)) {  
                deferred.resolve(organisations); 
            } else {       
                getTopOrganisations().then(function() { 
                    deferred.resolve(organisations);  
                }, function(rsp) { 
                    //alert("Request failed");
                    console.log(rsp);
                    deferred.reject(organisations);
                });        
            }        
            return deferred.promise;
        },
        getOrganisationLoggedin: function(email) { 
            var deferred = $q.defer();  

            if (!_.isEmpty(organisationLoggedin)) {  
                deferred.resolve(organisationLoggedin); 
            } else {        
                getCachedUsers().then(function(cachedUsers) { 
                    angular.forEach(cachedUsers, function(user) {
                         if (user.email === email) { 
                            organisationLoggedin = user;
                            deferred.resolve(organisationLoggedin); 
                        }  
                    });                     
                      
                }, function(rsp) { 
                    //alert("Request failed");
                    console.log(rsp);
                    deferred.reject(cachedUsers);
                });      
            }        
            return deferred.promise;
        }
    };
  });

});
