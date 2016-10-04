// Cacheable data for cloud tabs
'use strict';

define(['app', '../util'], function(app, formater) {
 
    /* global _ */
        
  app.factory('account', function(queryResource, $q) {
    var cachedUsers = [];
    var  url = ""; 
    var startTimestamp = "";
    var endTimestamp = "";
    
    function keystoneAccount() {     

        var deferred = $q.defer();
        var nq = queryResource.build(url);
        nq.query({object: 'account', count : 1000000}, function(data) {
            data = formater.keyArray(data, 'openstack_id'); 
            deferred.resolve(data);
        }, function(rsp) {  
                console.log(rsp);
                deferred.reject({});
        });
        
        return deferred.promise;
    }

    function keystoneSnapshot(accounts) { 
            
        var filter =  ["ts.ge." + startTimestamp,  "ts.lt." + endTimestamp];     
        var deferred = $q.defer(); 

        var nq = queryResource.build(url); 
        nq.query({object: 'snapshot', filter: filter, count : 1000000}, function(data) { 

            data.sort(function(a, b) {
                if (a.ts < b.ts) {return 1;}
                return -1;
            });   
                    
            deferred.resolve({ accounts : accounts , snapshotId : data[0].id }); 
        }, function(rsp) {  
                console.log(rsp);
                deferred.reject({});
        }); 
        
        return deferred.promise;
    } 

    function accountReferenceMapping(accountsSnapshot) {  
        var deferred = $q.defer();
        
        var snapshotId = accountsSnapshot.snapshotId;
        
        var accounts = accountsSnapshot.accounts; 
        accounts = _.values(accounts); 
        accounts = formater.keyArray(accounts, 'id'); 
         
        var nq = queryResource.build(url);
        var filter = 'snapshot_id.eq.' + snapshotId;
        nq.query({object: 'mapping', filter: filter, count : 1000000}, function(data) {
 
            angular.forEach(data, function(mapping) { 
                if (mapping.account && accounts[mapping.account]) { 
                    accounts[mapping.account].reference = mapping.reference; 
                }
            }); 
            deferred.resolve(accounts); 
        }, function(rsp) {  
                console.log(rsp);
                deferred.reject({});
        }); 
        
        return deferred.promise;
    }

    function accountReference(accounts) {     
                
        var references = {};

        var deferred = $q.defer();
        if (Object.keys(references).length > 0) {
            deferred.resolve(references);
        } else {
            var nq = queryResource.build(url);
            nq.query({object: 'reference', count : 1000000}, function(data) {  
                accounts = _.values(accounts);
                accounts = formater.keyArray(accounts, 'reference');  

                angular.forEach(data, function(reference) { 
                    if (reference.id && accounts[reference.id]) { 
                        accounts[reference.id].email = reference.value; 
                    }
                });                
                deferred.resolve(accounts);
            }, function(rsp) {  
                console.log(rsp);
                deferred.reject({});
            });
        }
        return deferred.promise;
    };    
    
    
    return function(_url, _startTimestamp, _endTimestamp) {
        url = _url;
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
        
        var deferred = $q.defer();
        if (Object.keys(cachedUsers).length > 0) {
            deferred.resolve(cachedUsers);
        } else { 
            keystoneAccount()  
            .then(keystoneSnapshot)
            .then(accountReferenceMapping)
            .then(accountReference).then(function(accounts) { 
                cachedUsers = accounts;
                deferred.resolve(cachedUsers);
            }, function(rsp) { 
                //alert("Request failed");
                console.log(rsp);
                deferred.reject({});
            }); 
        }
        return deferred.promise;
    };
    
  });
 

});
