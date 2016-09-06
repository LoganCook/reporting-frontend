define(['app', 'options', '../util2', '../util', './services', './crm'], function(app, options, util, formater) {
    'use strict';
    
    app.controller("NovasummaryController", ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "queryResource", "$q", "flavor", "tenant", "crm", "spinner",
    function($rootScope, $scope, $filter, timeout, reporting, org, queryResource, $q, flavor, tenant, crm, spinner) {

        /* global _ */
        
        /**
         * These variables are set in search and used in loadNextPage
         */ 
        var startTimestamp, endTimestamp;

        var cachedInstancesState = [];
        var cachedTenants = {}; 
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
        $scope.colTitles.push(['Project',  'User Name', 'Email', 'School', 'Cores Used', 'Allocated Cores', '%age Used', 'Cost per Core Used', 'Server Name']);
        $scope.colTitles.push(['Project',  'User Name', 'Email', 'School', 'Cores Used', 'Allocated Cores', '%age Used', 'Cost per Core Used']);

        $scope.fieldNames = [];
        var fieldNames = [];  
        fieldNames.push(['tenantName',  'fullname', 'email', 'school', 'core', 'allocatedCore', 'ageUsed1', 'cost', 'server']);
        fieldNames.push(['tenantName',  'fullname', 'email', 'school', 'core', 'allocatedCore', 'ageUsed1', 'cost']);
  
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
                    $scope.sum.coreAllocation, 
                    ' - ',  
                    ' - ',   
                    '$' + $scope.sum.cost.toFixed(2),
                    ' - '
                ]);      
            } else { 
                csvData.push([ 
                    'Grand Total',  
                    ' - ',  
                    ' - ',  
                    ' - ',  
                    $scope.sum.coreAllocation,  
                    ' - ',  
                    ' - ',  
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
            // initialize variables when fetching
            cachedInstancesState = [];
            
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
            crm.getNectarUsers().then(function(data) {
                cachedCrmNectar = data; 
            }) 
            .then(getTenants)
            .then(function(tenants) {
                
                angular.forEach(states, function(instance) { 
                    if (tenants[instance.tenant] && tenants[instance.tenant].name) {
                        instance.tenantName = tenants[instance.tenant].name;
                        instance.openstackId =  tenants[instance.tenant].openstack_id;
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
                        openstackId : instance.openstackId,
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
    }]);   
}); 
 