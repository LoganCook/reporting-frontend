define(['app', 'options', '../util2', '../util', './services'], function(app, options, util, formater) {
    'use strict';

    app.controller("NovasummaryController", ["$rootScope", "$scope", "$timeout", "reporting", "org", "queryResource", "$q", "flavor", "tenant", "spinner",
    function($rootScope, $scope, $timeout, reporting, org, queryResource, $q, flavor, tenant, spinner) {
         
        // These variables are set in search and used in loadNextPage
        var startTimestamp, endTimestamp;

        var cachedInstancesState = [];
        var cachedTenants = {};
        
        // defaults 
        $scope.domains = [];
        $scope.selectedDomain = '0';
        $scope.instancesState = []; 
        $scope.serverChecked = false;
        
        // search range
        $scope.rangeStart  =  new Date();
        $scope.rangeEnd =  new Date();
        $scope.rangeEndOpen = false;
        $scope.openRangeEnd = function() {
            $scope.rangeEndOpen = true;
        };

        // For creating table and exporting csv
        $scope.colTitles = []; 
        $scope.colTitles .push(['Tenant', 'Server ID', 'Server Name', 'Hypervisorname',
                        'Inventory Code', 'Hours', 'VCPUs', 'Usage', 'RAM', 'Disk', 'Ephemeral']);
        $scope.colTitles .push(['Tenant', 'VCPUs', 'Usage', 'Cores Used']);

        $scope.fieldNames = [];
        var fieldNames = [];
        fieldNames.push(['tenant_name', 'server_id', 'server', 'hypervisor',
                        'flavorname', 'span', 'core', 'format_usage', 'ram', 'disk','ephemeral']);
        fieldNames.push(['tenant_name', 'core', 'format_usage', 'cores_used1']);
  
        $scope.fieldNames = fieldNames[1];
        
        $scope.pickers = options.nova.pickers;
 
        // retrieve dates inuts from user and do a search
        $scope.load = function() {

            $scope.rangeStart = formater.firstDayOfYearAndMonth($scope.rangeEnd);
            $scope.rangeEnd = formater.lastDayOfYearAndMonth($scope.rangeEnd);
               
            startTimestamp = util.dateToTimestamp($scope.rangeStart);
            endTimestamp = util.dateToTimestamp($scope.rangeEnd, true);
            
            /** log start */
            var sdt = new Date(startTimestamp*1000);
            console.log(startTimestamp + ' -- ' + sdt);

            var edt = new Date(endTimestamp*1000);
            console.log(endTimestamp + ' -- ' + edt);
            /** log end */

            $scope.instancesState = []; 
            getInstances(startTimestamp, endTimestamp);
        };
 
        // prepare data for ng-csv
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

        $scope.selectDomain = function() { 
            var states = summaryInstances(cachedInstancesState);   
           
            if($scope.selectedDomain === '0'){
                $scope.instancesState = states;
                return;
            }  
            
            var instanceStates = [];  
            angular.forEach(states, function(instance) { 
                if (instance['organisation'] ===  $scope.selectedDomain) { 
                    instanceStates.push(instance); 
                }
            });  
            $scope.instancesState = instanceStates;    
        }; 
        
        // Internal functions
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
                //console.log("summaries==" + JSON.stringify(summaries)); 

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
            }else{ 
                deferred.reject(states);
            } 
            return deferred.promise;
        } 

        function doCalculation(states) {
            return flavor(sessionStorage['nova']).then(function(flavorMap) {
                for (var i = 0, l = states.length; i < l; i++) {
                    setFlavor(states[i], flavorMap);
                    formatOutputs(states[i]);
                }
                return states;
            });
        }

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

        function formatOutputs(instance) {
            // usage before rounding up span
            instance['usage'] = instance['span'] * instance['vcpus'];
            instance['span'] = (instance['span'] / 3600).toFixed(1);
            instance['ram'] = formater.formatNumber(instance['ram']);
        }

        function fillTenants(states) {  
            var deferred = $q.defer();
            
            getTenants().then(function(tenants) {
                angular.forEach(states, function(instance) { 
                    if (tenants[instance.tenant] && tenants[instance.tenant].name) {
                        instance.tenant_name = tenants[instance.tenant].name;
                    } else {
                        instance.tenant_name = instance.tenant;
                    }
                });
                deferred.resolve(states);
            });
            return deferred.promise;
        }  
        
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
        
        function summaryInstances(states) { 
            
            if ($scope.serverChecked) { 
                $scope.fieldNames = fieldNames[0];
                return formatUsageDuration(states);
            }
            
            var summed = {}; 
            $scope.fieldNames = fieldNames[1];
            angular.forEach(states, function(instance) {
                var _key = instance.tenant_name; 
                if (!(_key in summed)) {
                    summed[_key] = {
                        tenant_name: instance.tenant_name, 
                        organisation: instance.organisation, 
                        core: 0,
                        core_usag : 0, 
                        usage: 0
                    }; 
                }  
                summed[_key].core += instance.vcpus ;  
                summed[_key].usage += instance.usage ; 
            });
            
            summed = formatUsageDuration(_.values(summed));   
            return summed;  
        }
        
        
        function formatUsageDuration(states) { 
            angular.forEach(states, function(instance) {
                if(instance.vcpus){ 
                    instance['core'] = instance.vcpus;
                } 
                instance['format_usage'] = formater.formatDuration(instance.usage, 'seconds');  
                instance['cores_used'] =  (instance.usage / (3600 * 24 * 30)).toFixed(2);  
                
            });
            return states;
        }
        
    }]);   
});
