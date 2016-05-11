define(["app", "lodash", "mathjs","../util"], function(app, _, math, util) {
    app.controller("HCPController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
 
 
        $scope.values = _.values;

        $scope.formatSize = util.formatSize;
        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.alerts = []; 
  
        $scope.cache = {}; 
        $scope.cache.usage = [];
        $scope.usage = []; 
   
        $scope.owners = {};    
        
        var snapshots= {};    
        var allocations = {};   
        var tenants = {};   
        var namespaces = {};   
        
        var usageSummary = {};  
        
        var baseFilters = function() {
            return {
                count: 10000,
                page: 1
            };
        }; 
   
        var clear = function() {    
            snapshots= {};      
            
            $scope.cache = {}; 
            $scope.cache.usage = []; 
            usageSummary = {}; 
        }; 

 
        var initHcp = function() {  
            $rootScope.spinnerActive = true; 
            $scope.status = "Loading ...";  
            reporting.hcpBase(processInitData);  
        };

        var processInitData = function(svc, type, data) {  
            if (type == "allocation") {  
                if (data && data.length > 0) {  
                    Array.prototype.push.apply(allocations,  data);  
                    $scope.status = "Loaded " + data.length + " allocations."; 
 
                    reporting.hcpQuery("tenant", baseFilters(), processTenant);  
                } else { 
                    $scope.status = "Allocation: 0" ; 
                }                  
            }  
        };   

        var processTenant = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                Array.prototype.push.apply(tenants,  data);  
                $scope.status = "Loaded " + data.length + " tenants.";  
                
                $rootScope.spinnerActive = true;
                  
                var next = util.nextPage(query);
 
                reporting.hcpQuery("tenant", next, processTenant);
            } else { 
                $rootScope.spinnerActive = false;
                var allocationmMap = util.keyArray(allocations);  
                
                _.forEach(tenants, function(_tenant) {  
                    if (_tenant.allocation in allocationmMap) { 
                        _tenant.allocation_name = allocationmMap[_tenant.allocation].allocation;  
                    }                        
                });      
                
                reporting.hcpQuery("namespace", baseFilters(), processNamespace);   
            } 
        }; 


        var processNamespace = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                Array.prototype.push.apply(namespaces,  data);  
                $scope.status = "Loaded " + data.length + " namespaces.";  
                
                $rootScope.spinnerActive = true;
                  
                var next = util.nextPage(query);
 
                reporting.hcpQuery("namespace", next, processNamespace);
            } else { 
                $rootScope.spinnerActive = false;
                var tenantmMap = util.keyArray(tenants);  
                
                _.forEach(namespaces, function(_namespace) {  
                    if (_namespace.tenant in tenantmMap) { 
                        _namespace.tenant_name = tenantmMap[_namespace.tenant].name;  
                    }                        
                });       
            } 
        }; 



        clear();
        initHcp();     

        /**
         * This function is called from _export() in ersa-search directive
         */
        $scope.export = function() {
            var dataWithTitle = [
                ["Name", "Capacity", "Free(avg)", "Live usage(avg)", "Snapshot usage"]
            ];
            var data = [];

            _.forEach(usageSummary, function(usage) {
                data.push([
                    usage.name,
                    $scope.formatNumber(usage.capacity),
                    $scope.formatNumber(usage.free / usage.usageCount),
                    $scope.formatNumber(usage.live_usage / usage.usageCount),
                    $scope.formatNumber(usage.snapshot_usage) 
                ]);
            });
            
            data.sort(function(a, b) {
                if(a[0].toLowerCase() >= b[0].toLowerCase()){return 1;}
                return -1; 
            });
            
            Array.prototype.push.apply(dataWithTitle, data); 
            return dataWithTitle;
        };        

        /**
         * This function is called from _load() in ersa-search directive
         * arg : rangeEpochFilter - filter:["end.ge.1459953000", "end.lt.1460039400"]
         */        
        $scope.load = function(rangeEpochFilter) { 
            
            clear();  
            
            var rangeStartEpoch = util.dayStart($scope.rangeStart);
            var rangeEndEpoch = util.dayEnd($scope.rangeEnd);
            
            var filter =  {
                    filter: [
                        "ts.ge." + rangeStartEpoch,
                        "ts.lt." + rangeEndEpoch
                    ]
                };             
            
            var query =  _.merge({count: 100000}, filter); 
            $scope.status = "Loading snapshots ...";  
            reporting.hcpQuery("snapshot", query, processSnapshot);  
        };
        
        var processSnapshot = function(svc, type, query, data) { 
            
            snapshots = util.keyArray(data); 
            
            if (data && data.length > 0) { 
                
                $scope.status = "Loading usage ...";  

                var allsnapshot = data.length;    
                var _param = "";
                for(var i = 1; i <= allsnapshot; i++){
                    _param += data[i - 1].id ;
                    if( i != allsnapshot){  
                        _param += ",";
                    } 
                }                
                
                loadUsage(_param); 
                
            } else {  
                $scope.status = "Loaded " + "0 snapshots."; 
            } 
        };     


        var loadUsage = function(_snapshotParams) {   
            
            var filter =  {filter: ["snapshot.in." + _snapshotParams]};  
            var query = _.merge(baseFilters(), filter);

            $rootScope.spinnerActive = true; 

            $scope.status = "Loading ...";  
            reporting.hcpQuery("usage", query, processUsage);     
        };
   
        var processUsage = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                Array.prototype.push.apply($scope.cache.usage, data);  
                $scope.status = "Loaded " + $scope.cache.usage.length + " usages"; 
                
                $rootScope.spinnerActive = true; 
                var next = util.nextPage(query);
 
                reporting.hcpQuery("usage", next, processUsage);
            } else {  
                $rootScope.spinnerActive = false;
                
                mapUsage($scope.cache.usage); 
                $scope.filesystemUsage = _.values(usageSummary);
            } 
        };
                 
        
        var mapUsage = function(data) {  
            
            var namespaceMap = util.keyArray(namespaces);  
            var swap = []; 
            _.forEach(data, function(_usage) {
                //if($scope.selectedDomain != '' && $scope.selectedDomain != _instanceState.status){
                //    return ; 
                //}   

                if (!(_usage.namespace in usageSummary)) {

                    usageSummary[_usage.namespace] = { 
                        namespace_id: _usage.namespace,                       
                        namespace_name: namespaceMap[_usage.namespace].name, 
                        ingested_bytes : 0,
                        raw_bytes : 0,
                        reads : 0,
                        writes : 0,
                        deletes : 0,
                        usageCount: 0
                    };     
                    
                    if(_usage.snapshot in snapshots){ 
                        usageSummary[_usage.namespace].snapshotmin= snapshots[_usage.snapshot].ts;
                        usageSummary[_usage.namespace].snapshotmax= snapshots[_usage.snapshot].ts;
                    } 
                }   
                  
                if(_usage.snapshot in snapshots){
                    var _min = usageSummary[_usage.namespace].snapshotmin;
                    var _max = usageSummary[_usage.namespace].snapshotmax; 
                    usageSummary[_usage.namespace].snapshotmin = Math.min(_min, snapshots[_usage.snapshot].ts);
                    usageSummary[_usage.namespace].snapshotmax = Math.max(_max, snapshots[_usage.snapshot].ts);
                }  
                                
                if(_usage.namespace in namespaceMap){   
                    usageSummary[_usage.namespace].usageCount++; 
                    usageSummary[_usage.namespace].ingested_bytes += _usage.ingested_bytes;
                    usageSummary[_usage.namespace].raw_bytes += _usage.raw_bytes;
                    usageSummary[_usage.namespace].reads += _usage.reads;
                    usageSummary[_usage.namespace].writes += _usage.writes;
                    usageSummary[_usage.namespace].deletes += _usage.deletes;
                }      
                //swap.push(_.values(usageSummary));                
            });
            return swap;
        }  
        
        $scope.$on('$viewContentLoaded', function() { 

            $scope.startDateTitle = "Snapshot Start Date";
            $scope.endDateTitle = "Snapshot End Date";
                            
            var startDate = new Date();
            var endDate = new Date();
            startDate.setDate(startDate.getDate() -1);
           // $scope.rangeStart = startDate;
            //endDate.setDate(endDate.getDate() -82);
            //$scope.rangeEnd = endDate;
            console.log('viewContentLoaded ...'); 
        });    
        
    }]);   
});
