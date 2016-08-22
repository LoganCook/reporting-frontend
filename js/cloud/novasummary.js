define(['app', 'options', '../util2', '../util', './services'], function(app, options, util, formater) {
    'use strict';
    
    app.controller("NovasummaryController", ["$rootScope", "$scope", "$timeout", "reporting", "org", "queryResource", "$q", "flavor", "tenant", "spinner",
    function($rootScope, $scope, $timeout, reporting, org, queryResource, $q, flavor, tenant, spinner) {

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
         
        /**
         * summary variables
         */ 
        $scope.sum = { core : 0, coresUsed : 0, cost : 0}; 
         
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
        //$scope.colTitles .push(['Tenant', 'Server ID', 'Server Name', 'Hypervisorname',
        //                'Inventory Code', 'Hours', 'VCPUs', 'Usage', 'RAM', 'Disk', 'Ephemeral']);
        $scope.colTitles.push(['Tenant', 'Server Name', 'Hypervisorname',
                        'Inventory Code', 'Hours', 'VCPUs', 'Usage', 'Cores Used', '%age Used', 'Cost per Core Used ($15)']);
        $scope.colTitles.push(['Tenant', 'VCPUs', 'Usage', 'Cores Used', '%age Used', 'Cost per Core Used ($15)']);

        $scope.fieldNames = [];
        var fieldNames = [];
        //fieldNames.push(['tenantName', 'server_id', 'server', 'hypervisor',
        //                'flavorname', 'span', 'core', 'formatUsage', 'ram', 'disk','ephemeral']);
        fieldNames.push(['tenantName', 'server', 'hypervisor',
                        'flavorname', 'span', 'core', 'formatUsage', 'coresUsed', 'ageUsed', 'cost1']);
        fieldNames.push(['tenantName', 'core', 'formatUsage', 'coresUsed', 'ageUsed', 'cost1']);
  
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
            csvData[0] = $scope.colTitles[$scope.serverChecked ? 0 : 1];

            var fieldCount = $scope.fieldNames.length, i, j;
            for (i = 0; i < rowCount; i++) {
                csvData[i + 1] = Array(fieldCount);
                for (j = 0; j < fieldCount; j++) {
                    csvData[i + 1][j] = $scope.instancesState[i][$scope.fieldNames[j]];
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
            spinner.start();
            var args = {
                //object: 'summary',
                object: 'NovaUsage_1451568600_1454246999.json', 
                start: startTime,
                end: endTime, 
                distinct: true
            };
            //var nq = queryResource.build(sessionStorage['nova']);
            var nq = queryResource.build("http://localhost:8080/nova");
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
         * calculate usage with the number of cup
         * 
         * @param {Object} instance - summaried instances  
         * @return {Void}
         */ 
        function formatOutputs(instance) {
            // usage before rounding up span
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
            
            getTenants().then(function(tenants) {
                angular.forEach(states, function(instance) { 
                    if (tenants[instance.tenant] && tenants[instance.tenant].name) {
                        instance.tenantName = tenants[instance.tenant].name;
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
                return formatUsageDuration(states);
            }
            
            var summed = {}; 
            $scope.fieldNames = fieldNames[1];
            angular.forEach(states, function(instance) {
                var _key = instance.tenantName; 
                if (!(_key in summed)) {
                    summed[_key] = {
                        tenantName: instance.tenantName, 
                        organisation: instance.organisation, 
                        core: 0, 
                        usage: 0
                    }; 
                }  
                summed[_key].core += instance.vcpus ;  
                summed[_key].usage += instance.usage ; 
            });
            
            summed = formatUsageDuration(_.values(summed));   
            return summed;  
        }
        
        /** 
         * summary instance cost per core Used.
         * 
         * @param {Array} states - array of instances 
         * @return {Array} states - array of instances summary 
         */ 
        function formatUsageDuration(states) { 
            $scope.sum = { core : 0, coresUsed : 0, cost : 0};
            
            angular.forEach(states, function(instance) {
                if (instance.vcpus) {// for filter by server 
                    instance['core'] = instance.vcpus;
                } 
                     
                instance['formatUsage'] = formater.formatDuration(instance.usage, 'seconds');  
                instance['coresUsed'] =  (instance.usage / (3600 * 24 * 30)).toFixed(2);  
                instance['ageUsed'] =  ((instance.coresUsed / instance.core) * 100).toFixed(2) + '%'; 
                instance['cost'] =  '$' + (instance.coresUsed * 15).toFixed(2);    

                $scope.sum.core += instance.core ; 
                $scope.sum.coresUsed += instance.coresUsed * 1; 
                $scope.sum.cost += instance.coresUsed * 15 ;                 
            });
            return states;
        }
        
    }]);   
}); 
 