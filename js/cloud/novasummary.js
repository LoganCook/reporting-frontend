define(['app', 'options', '../util2', '../util', './services'], function(app, options, util, formater) {
    'use strict';
    
    app.controller("NovasummaryController", ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "queryResource", "$q", "flavor", "tenant", "spinner",
    function($rootScope, $scope, $filter, timeout, reporting, org, queryResource, $q, flavor, tenant, spinner) {

        /* global _ */
        
        /**
         * These variables are set in search and used in loadNextPage
         */ 
        var startTimestamp, endTimestamp;

        var cachedInstancesState = [];
        var cachedTenants = {};
        var cachedUseres = [];
        var cachedCrmNectar = [];         
         
        /**
         * defaults 
         */ 
        $scope.domains = [];
        $scope.selectedDomain = '0';
        $scope.instancesState = []; 
        $scope.serverChecked = false;
         
        /**
         * summary variables
         */ 
        $scope.sum = { core : 0, coreAllocation : 0, cost : 0};
         
        /**
         * search range
         */ 
        $scope.rangeStart  =  new Date();
        $scope.rangeEnd =  new Date();
        $scope.rangeEndOpen = false;
        $scope.openRangeEnd = function() {
            $scope.rangeEndOpen = true;
        };
 
        /**
         * For creating table and exporting csv
         */ 
        $scope.colTitles = [];  
        //$scope.colTitles.push(['Tenant', 'Server Name',  'Core Allocation', 'Current Core Usage',  '%age Used', 'Cost per Core Used ($10)']);
        //$scope.colTitles.push(['Tenant',                 'Core Allocation', 'Current Core Usage',  '%age Used', 'Cost per Core Used ($10)']);
        $scope.colTitles.push(['Tenant', 'User Name', 'Email', 'School','Server Name', 'Current Core Usage',  'Cost per Core Used ($10)']);
        $scope.colTitles.push(['Tenant', 'User Name', 'Email', 'School',               'Current Core Usage',  'Cost per Core Used ($10)']);

        $scope.fieldNames = [];
        var fieldNames = []; 
        //fieldNames.push(['tenantName', 'server', 'coreAllocation', 'core', 'ageUsed', 'cost']);
        //fieldNames.push(['tenantName', 'coreAllocation', 'core', 'ageUsed', 'cost']);
        fieldNames.push(['tenantName', 'fullname', 'email11', 'school1','server', 'core', 'cost']);
        fieldNames.push(['tenantName', 'fullname', 'email11', 'school1',          'core', 'cost']);
  
        $scope.fieldNames = fieldNames[1];
         
  
        /**
         * retrieve data with qeury string.  
         *  
         * @export
         */ 
        $scope.load = function() {

            $scope.rangeStart = formater.firstDayOfYearAndMonth($scope.rangeEnd);
            $scope.rangeEnd = formater.lastDayOfYearAndMonth($scope.rangeEnd);
               
            startTimestamp = util.dateToTimestamp($scope.rangeStart);
            endTimestamp = util.dateToTimestamp($scope.rangeEnd, true);
            
            /** log start */
            var sdt = new Date(startTimestamp * 1000);
            console.log(startTimestamp + ' -- ' + sdt);

            var edt = new Date(endTimestamp * 1000);
            console.log(endTimestamp + ' -- ' + edt);
            /** log end */

            $scope.instancesState = []; 
            getInstances(startTimestamp, endTimestamp);
        };
  
  
        /**
         * create TSV file data with summary data that has already fetched and stored.
         * 
         * @export
         * @return{Array} data
         */ 
        $scope.export = function () {
            var rowCount = $scope.instancesState.length;
            var csvData = Array(rowCount + 1); 

            var fieldCount = $scope.fieldNames.length, i, j;
            for (i = 0; i < rowCount; i++) {
                csvData[i + 1] = Array(fieldCount);
                for (j = 0; j < fieldCount; j++) {
                    csvData[i + 1][j] = $scope.instancesState[i][$scope.fieldNames[j]];
                }
            } 

            csvData.sort(function(a, b) {
                if (a[0] >= b[0]) {return 1;}
                return -1;
            });

            csvData[0] = $scope.colTitles[$scope.serverChecked ? 0 : 1];
 
            /** Grand total data. */
            if ($scope.serverChecked) { 
                csvData.push([ 
                    'Grand Total', 
                    ' - ',  
                    ' - ',  
                    ' - ',  
                    ' - ',  
                    $scope.sum.coreAllocation,  
                    '$' + $scope.sum.cost.toFixed(2) 
                ]);      
            } else { 
                csvData.push([ 
                    'Grand Total',  
                    ' - ',  
                    ' - ',  
                    ' - ',  
                    $scope.sum.coreAllocation,  
                    '$' + $scope.sum.cost.toFixed(2) 
                ]); 
            }  
            return csvData;
        };

        /**
         * When user change organisation on the page, this fucnction will be called 
         * to filter data.
         *  
         * @export
         */ 
        $scope.selectDomain = function() {    
           
            if ($scope.selectedDomain === '0') {
                $scope.instancesState = summaryInstances(cachedInstancesState);
                return;
            }  
            
            var instanceStates = [];  
            angular.forEach(cachedInstancesState, function(instance) { 
                if (instance['organisation'] ===  $scope.selectedDomain) { 
                    instanceStates.push(instance); 
                }
            });  
            $scope.instancesState = summaryInstances(instanceStates);    
        }; 
         
        /**
         * request instance summary main
         *  
         * @param {Date} startTime - start date for request
         * @param {Date} endTime - end date for request 
         * @return {Void}
         */ 
        function getInstances(startTime, endTime) {
            
            //var summaryUrl = '/usage/nova/NovaUsage_'  + startTime + '_' + endTime + '.json';
            var summaryUrl = '/usage/nova/NovaUsage_'  + 1451568600 + '_' + 1454246999 + '.json';
            console.log('summaryUrl=' + summaryUrl);
            
            spinner.start();
            var args = { 
                object: summaryUrl, 
                start: startTime,
                end: endTime, 
                distinct: true
            };
            //var nq = queryResource.build(sessionStorage['nova']);
            var nq = queryResource.build("http://localhost:8080");
            nq.query(args, function(summaries) {  

                getInstanceState(summaries) 
                .then(doCalculation)
                .then(fillTenants)
                .then(function(states) {
                    cachedInstancesState = cachedInstancesState.concat(states);
                    
                    var summaryStates = summaryInstances(states);
                    $scope.instancesState = $scope.instancesState.concat(summaryStates); 
                    
                    spinner.stop();
                }); 
            }, function(rsp) {
                spinner.stop();
                alert("Request failed");
                console.log(rsp);
            });
        }
        
        /**
         * request instance state
         * 
         * @param {Array} states - array of instances 
         * @return {Object} $q.defer 
         */ 
        function getInstanceState(states) { 

            var deferred = $q.defer(); 
            var topOrg = []; 
            
            if (states.length) { 
                angular.forEach(states, function(instance) {
                    var arr = instance['manager'];
                    if (arr.length) {
                        instance['organisation'] = arr[0];
                        topOrg.push(arr[0]);
                    } else {
                        instance['organisation'] = ' - ';
                    }
                });  
                $scope.domains = _.union(topOrg);    
                deferred.resolve(states); 
            } else { 
                deferred.reject(states);
            } 
            return deferred.promise;
        } 

        /**
         * request flavor and assign it to each instance summary data.
         * calculate usage with the number of cup
         * 
         * @param {Array} states - array of instances 
         * @return {Array} states
         */ 
        function doCalculation(states) {
            return flavor(sessionStorage['nova']).then(function(flavorMap) {
                for (var i = 0, l = states.length; i < l; i++) {
                    setFlavor(states[i], flavorMap);
                    formatOutputs(states[i]);
                }
                return states;
            });
        }

        /**
         * assign it to each instance summary data
         * 
         * @param {Object} instance - summaried instances  
         * @param {Object} flavorMap - flavor hashmap 
         * @return {Void}
         */ 
        function setFlavor(instance, flavorMap) {
            var flavorAttrs = ['name', 'vcpus', 'ram', 'disk', 'ephemeral'];
            if (instance['flavor'] in flavorMap) {
                angular.forEach(flavorAttrs, function(attr) {
                    if (attr === 'name') {
                        instance['flavorname'] = flavorMap[instance['flavor']][attr];
                    } else {
                        instance[attr] = flavorMap[instance['flavor']][attr];
                    }
                });
            } else {
                angular.forEach(flavorAttrs, function(attr) {
                    if (attr === 'name') {
                        instance['flavorname'] = '-';
                    } else {
                        instance[attr] = '-';
                    }
                });
            }
        }

        /** 
         * calculate usage with the number of cpu
         * 
         * @param {Object} instance - summaried instances  
         * @return {Void}
         */ 
        function formatOutputs(instance) {
            // usage before rounding up span
            instance['coreAllocation'] = instance['vcpus'];
            instance['usage'] = instance['span'] * instance['vcpus'];
            instance['span'] = (instance['span'] / 3600).toFixed(1);
            instance['ram'] = formater.formatNumber(instance['ram']);
        }

        /** 
         * request tenant  and assign tenantName to each instance summary data.
         * 
         * @param {Array} states - array of instances 
         * @return {Object} $q.defer 
         */ 
        function fillTenants(states) {  
            var deferred = $q.defer();
            getCrms() 
            .then(getTenants)
            .then(function(tenants) {
                 
                angular.forEach(states, function(instance) { 
                    if (tenants[instance.tenant] && tenants[instance.tenant].name) {
                        instance.tenantName = tenants[instance.tenant].name;
                        instance.openstack_id =  tenants[instance.tenant].openstack_id;
                        instance.fullname = tenants[instance.tenant].fullname;
                        instance.school = tenants[instance.tenant].organisation;
                        instance.email = tenants[instance.tenant].email;
                    } else {
                        instance.tenantName = instance.tenant;
                    }
                });
                deferred.resolve(states);
            });
            return deferred.promise;
        }  
        
        /** 
         * request tenant bulk data.
         *  
         * @return {Object} $q.defer 
         */ 
        function getTenants() { 
            var deferred = $q.defer(); 
            
            if (!_.isEmpty(cachedTenants)) {  
                deferred.resolve(cachedTenants); 
            } else { 
                var args = { 
                    object: 'tenant',
                    count: 1000000
                }; 
                var nq = queryResource.build(sessionStorage['keystone']);
                nq.query(args, function(details) { 
                      
                    cachedTenants = formater.keyArray(details, 'openstack_id');   

                    for (var tennantId in cachedTenants) {  
                        if (cachedCrmNectar[tennantId]) { 
                            cachedTenants[tennantId].fullname = cachedCrmNectar[tennantId].fullname; 
                            cachedTenants[tennantId].organisation = cachedCrmNectar[tennantId].organisation;
                            cachedTenants[tennantId].email = cachedCrmNectar[tennantId].email;
                        }
                    }                      
                    
                    console.log('getTenants==' + JSON.stringify(cachedTenants));
                    
                    deferred.resolve(cachedTenants); 
                }, function(rsp) { 
                    alert("Request failed");
                    console.log(rsp);
                    deferred.reject(cachedTenants);
                });                      
            } 
            return deferred.promise;
        } 
         

        /** 
         * summary instance by server or tenantName.
         * 
         * @param {Array} states - array of instances 
         * @return {Array} summed - array of instance summary 
         */ 
        function summaryInstances(states) { 
            
            if ($scope.serverChecked) { 
                $scope.fieldNames = fieldNames[0];
                return formatUsage(states);
            }
            
            var summed = {}; 
            $scope.fieldNames = fieldNames[1];
            angular.forEach(states, function(instance) {
                var _key = instance.tenantName; 
                if (!(_key in summed)) {
                    summed[_key] = {
                        organisation: instance.organisation,
                        tenantName: instance.tenantName, 
                        openstack_id : instance.openstack_id,
                        fullname: instance.fullname, 
                        school: instance.school,
                        email: instance.email,
                        coreAllocation: 0, 
                        core: 0, 
                        usage: 0
                    }; 
                }  
                summed[_key].coreAllocation += instance.coreAllocation ;  
                summed[_key].core += instance.vcpus ;  
                summed[_key].usage += instance.usage ; 
            });
            
            summed = formatUsage(_.values(summed));   
            return summed;  
        }
                             
        /** 
         * summary instance cost per core Used.
         * 
         * @param {Array} states - array of instances 
         * @return {Array} states - array of instances summary 
         */ 
        function formatUsage(states) { 
            $scope.sum = { core : 0, coreAllocation : 0, cost : 0};
            
            angular.forEach(states, function(instance) {
                if (instance.vcpus) {// for filter by server 
                    instance['core'] = instance.vcpus;
                } 
                      
                instance['ageUsed'] =  ((instance.core / instance.coreAllocation) * 100).toFixed(2) + '%'; 
                instance['cost'] =  '$' + (instance.coreAllocation * 10).toFixed(2);    

                $scope.sum.coreAllocation += instance.coreAllocation ; 
                $scope.sum.core += instance.core ;  
                $scope.sum.cost += instance.coreAllocation * 10 ;                 
            });
            return states;
        }
        
                        
        function getCrms() { 
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
                    .then(function(cachedCrmNectar) {
                        
                        deferred.resolve(cachedCrmNectar); 
                    });  
                }, function(rsp) { 
                    alert("Request failed");
                    console.log(rsp);
                    deferred.reject(cachedCrmNectar);
                });          
            }        
            return deferred.promise;
        } 
                 
        
        function getOrganisationUseres(organisations) { 
            var deferred = $q.defer();  

            var  queryies = [];
            organisations.forEach(function(organisation) {
                queryies.push(getUseres(organisation.pk));
            });                
            
            $q.all(queryies).then(function(details) {
                var buff = {};
                organisations.forEach(function(organisation) { 
                    _.extend(buff, cachedUseres[organisation.pk]); 
                });  
                cachedUseres = _.values(buff); 
                cachedUseres = formater.keyArray(cachedUseres, 'personid');   
        
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
            var roles = [];
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
                    cachedUseres = formater.keyArray(cachedUseres, 'contractor');  
                    var tempCrmNectar = [];
                    angular.forEach(details, function(nectar) {
                        tempCrmNectar.push(nectar.fields);   
                    }); 
                                    
                    tempCrmNectar = formater.keyArray(tempCrmNectar, 'tennant_id');  

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
                
                
    }]);   
}); 
 