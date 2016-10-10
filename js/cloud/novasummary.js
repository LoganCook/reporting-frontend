define(['app', 'options', '../util2', '../util', './services', '../crm', './account'], function(app, options, util, formater) {
    'use strict';
    
    app.controller("NovasummaryController", ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "queryResource", "$q", "flavor", "tenant", "crm", "account", "spinner",
    function($rootScope, $scope, $filter, timeout, reporting, org, queryResource, $q, flavor, tenant, crm, account, spinner) {

        /* global _ */
        
        /**
         * These variables are set in search and used in loadNextPage
         */ 
        var startTimestamp, endTimestamp;

        var cachedInstancesState = [];
        var cachedTenants = {};    
          
        /**
         * defaults 
         */ 
        $scope.domains = [];
        $scope.selectedDomain = '0';
        $scope.instancesState = []; 
        $scope.serverChecked = false;
        $scope.loggedInAsErsaUser = sessionStorage['ersaUser'] === 'true' ? true : false ;

 
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
        $scope.fieldNames = [];
        var fieldNames = [];   
        if ($scope.loggedInAsErsaUser) {
            $scope.colTitles.push(['Organisation', 'Project',  'User Name', 'Email', 'School', 'Total Cores Used', 'Core Quota Allocated', 'Cost per Core Used', 'Server Name']);
            $scope.colTitles.push(['Organisation', 'Project',                                  'Total Cores Used', 'Core Quota Allocated', 'Cost per Core Used']);

            fieldNames.push(['organisation', 'tenantName',  'fullname', 'email', 'school', 'core', 'allocatedCore', 'cost', 'server']);
            fieldNames.push(['organisation', 'tenantName',  'core', 'allocatedCore', 'cost']);
        } else {
            $scope.colTitles.push(['Project',  'User Name', 'Email', 'School', 'Total Cores Used', 'Core Quota Allocated', 'Cost per Core Used', 'Server Name']);
            $scope.colTitles.push(['Project',                                  'Total Cores Used', 'Core Quota Allocated', 'Cost per Core Used']);

            fieldNames.push(['tenantName',  'fullname', 'email', 'school', 'core', 'allocatedCore', 'cost', 'server']);
            fieldNames.push(['tenantName',  'core', 'allocatedCore', 'cost']);
        }

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
             
            $scope.selectedDomain = '0'; 
            $scope.serverChecked = false;
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
            if ($scope.loggedInAsErsaUser) {
         
                if ($scope.serverChecked) { 
                    csvData.push([ 
                        'Grand Total', 
                        ' - ',  
                        ' - ',  
                        ' - ',  
                        ' - ',  
                        $scope.sum.coreAllocation, 
                        ' - ',   
                        '$' + $scope.sum.cost.toFixed(2),
                        ' - '
                    ]);      
                } else { 
                    csvData.push([ 
                        'Grand Total',   
                        ' - ',  
                        $scope.sum.coreAllocation,  
                        ' - ',   
                        '$' + $scope.sum.cost.toFixed(2) 
                    ]); 
                }                  
            } else {
                if ($scope.serverChecked) { 
                    csvData.push([ 
                        'Grand Total', 
                        ' - ',  
                        ' - ',  
                        ' - ',  
                        $scope.sum.coreAllocation, 
                        ' - ',   
                        '$' + $scope.sum.cost.toFixed(2),
                        ' - '
                    ]);      
                } else { 
                    csvData.push([ 
                        'Grand Total',   
                        $scope.sum.coreAllocation,  
                        ' - ',   
                        '$' + $scope.sum.cost.toFixed(2) 
                    ]); 
                }                   
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
            // initialize variables when fetching
            cachedInstancesState = [];
            
            //var summaryUrl = '/usage/nova/NovaUsage_'  + startTime + '_' + endTime + '.json';
            var summaryUrl = '/usage/nova/NovaUsage_'  + 1451568600 + '_' + 1454246999 + '.json';
             
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
            }, function(rsp) {  
                spinner.stop();  
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
        
        var organisationLoggedin = {};

        /** 
         * request tenant  and assign tenantName to each instance summary data.
         * 
         * @param {Array} states - array of instances 
         * @return {Object} $q.defer 
         */ 
        function fillTenants(states) {  
            var deferred = $q.defer();
            crm.getUsersByPersonId() 
            .then(function(users) {
                /** attain top orgainsation which user logged in */
                crm.getOrganisationLoggedin('hanieh.ghodrati@adelaide.edu.au').then(function(orgLoggedin) { 
                    //$scope.selectedDomain = orgLoggedin.name; 
                    //console.log('organisationLoggedin=' + JSON.stringify($scope.selectedDomain));
                
                    return users;
                });
            })
            .then(fillAccouns)
            .then(getTenants)
            .then(function(tenantsUsers) {
                cachedTenants = tenantsUsers.tenants; 
                
                angular.forEach(states, function(instance) { 
                    if (cachedTenants[instance.tenant] && cachedTenants[instance.tenant].name) {
                        instance.tenantName = cachedTenants[instance.tenant].name; 
                    } else {
                        instance.tenantName = instance.tenant;
                    }
                });

                var users = tenantsUsers.users;                

                users = formater.keyArray(users, 'openstack_id');   
                
                angular.forEach(states, function(instance) { 
                    if (users[instance.account] && users[instance.account].email) { 
                        instance.fullname = users[instance.account].fullname;
                        instance.school = users[instance.account].organisation;
                        instance.email = users[instance.account].email; 
                    }
                }); 
                
                deferred.resolve(states);
            }, function(rsp) {  
                spinner.stop(); 
                deferred.reject({});
            });
            return deferred.promise;
        }  
        
        /** 
         * request tenant bulk data.
         *  
         * @return {Object} $q.defer 
         */ 
        function getTenants(cachedCrmUsers) { 
            var deferred = $q.defer(); 
            
            if (!_.isEmpty(cachedTenants)) {
                var obj = {tenants : cachedTenants , users : cachedCrmUsers};  
                deferred.resolve(obj); 
            } else { 
                var args = { 
                    object: 'tenant',
                    count: 1000000
                }; 
                var nq = queryResource.build(sessionStorage['keystone']);
                nq.query(args, function(details) { 
                      
                    cachedTenants = formater.keyArray(details, 'openstack_id');   
                    
                    var tenantsUsers = {tenants : cachedTenants , users : cachedCrmUsers};
                    deferred.resolve(tenantsUsers); 
                }, function(rsp) { 
                    alert("Request failed");
                    spinner.stop();
                    console.log(rsp);
                    deferred.reject({});
                });                      
            } 
            return deferred.promise;
        } 
         

        function fillAccouns(cachedCrmUsers) {  
            var deferred = $q.defer();
            
            account(sessionStorage['keystone'],  startTimestamp, endTimestamp)
            .then(function(accounts) {

                cachedCrmUsers = formater.keyArray(cachedCrmUsers, 'email');  
                accounts = _.values(accounts);   
                 
                angular.forEach(accounts, function(user) { 
                    if (user.email && cachedCrmUsers[user.email]) { 
                        user.fullname = cachedCrmUsers[user.email].fullname; 
                        user.organisation = cachedCrmUsers[user.email].organisation; 
                    } 
                });             
                
                deferred.resolve(accounts);
                
            }, function(rsp) { 
                alert("Request failed");
                spinner.stop();
                console.log(rsp);
                deferred.reject({});
            });     
            
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
                        openstackId : instance.openstackId,
                        fullname: instance.fullname, 
                        school: instance.school,
                        email: instance.email,
                        coreAllocation: 0, 
                        core: 0, 
                        usage: 0
                    }; 
                }  
                
                /**
                 * Check if billing organisation selected
                 * if selected, remove other school summary in other billing organisation
                 */ 
                if ($scope.selectedDomain != '0') {
                    if ($scope.selectedDomain != summed[_key].organisation) {
                        delete summed[_key];
                        return;
                    }
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
    }]);   
}); 
 