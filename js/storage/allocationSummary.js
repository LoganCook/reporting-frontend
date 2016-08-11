define(["app", "lodash", "mathjs","../util", "properties"], function(app, _, math, util, props) {
    app.controller("AllocationSummaryController", ["$rootScope", "$scope", "$timeout", "$q", "$filter", "reporting", "org", "spinner",
    function($rootScope, $scope, $timeout, $q, $filter, reporting, org, spinner) {

        /**
         * There are some filesystem which don't need to summary and display.
         * It is defined in properties.js
         */ 
        var invisible = props['allocation.summary.invisible.filesystem'];  
        var hpchomeFilesystem = ''; 
        
        $scope.values = _.values;

        $scope.formatSize = util.formatSize;
        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.Math = window.Math;
        
        $scope.alerts = []; 
  
        $scope.usages = [];  
        
        $scope.topOrgs = [];   
        $scope.topRdsOrgs = [];  
        $scope.selectedBillingOrg = '0'; 
        $scope.select = {};
        $scope.filesystemChecked = false; 
        
        $scope.total = {};           
        
        $scope.rangeStart  =  new Date();
        $scope.rangeEnd =  new Date();
        $scope.rangeEndOpen = false;
        $scope.openRangeEnd = function() {
            $scope.rangeEndOpen = true;
        }; 
        
        var xfsDefaultHost = "";
        var users = {};
        var rdses = {}; 
        var roles = {};
        
        var cache = {};  
        cache.virtualVolumeUsage = [];  
        cache.filesystemUsage = [];
        cache.xfsUsage = [];
        
        var hnas = {};
        hnas.owners = {};   
        hnas.snapshots = {};  
        hnas.filesystems = {};    
        hnas.virtualVolumes = {};  
        
        var xfs = {}; 
        xfs.owners = {};   
        xfs.snapshots = {};  
        xfs.filesystems = {};       
    
        var vuDeferred = {};
        var fuDeferred = {};
        var xfsDeferred = {};
           
        var baseFilters = function() {
            return {
                count: 10000,
                page: 1
            };
        }; 
    
        /**
         * Service names that should be requested before feching XFS and HNAS data
         * This is for displaying status of current processing on the page.
         * Refer to service.xfsBase in client.js.
         */         
        var serviceXFSTypes = ["snapshot", "host", "filesystem", "owner"]; 
        var serviceHnasTypes = ["filesystem", "owner", "virtual-volume"];

        /**
         * Whenever user click 'Update' button, this is called  
         * to clear variable and remove stored data.
         *   
         * @return {Void}
         */         
        var clear = function() {   
            vuDeferred = {};
            fuDeferred = {};
            xfsDeferred = {};
             
            cache = {}; 
            cache.virtualVolumeUsage = [];  
            cache.filesystemUsage = []; 
            cache.xfsUsage = [];
             
            $scope.usages = []; 
            $scope.total = {};
        }; 

        /**
         * When this page is requested, this fucnction is called automatically
         * to fetch basic HNAS data ("filesystem", "owner", "virtual-volume").
         *   
         * @return {Void}
         */ 
        var initHnas = function() {  
            $scope.status = "Loading ...";   
            spinner.start();
            
            reporting.hnasBase(processInitData);  
        }; 
        

        /**
         * Callback function for fetching init HNAS data.
         * When finish request filesystem data, this will call processVirtualVolume(). 
         *  
         * @param {String} svc - 'hnas'
         * @param {String} type - service name ("filesystem", "owner", "virtual-volume")
         * @param {Array} data - fetched data
         * @return {Void} 
         */ 
        var processInitData = function(svc, type, data) {  
            if (type == "filesystem") {  

                if (data && data.length > 0) {  
                    $scope.status = "Loaded " + data.length + " filesystems.";  
 
                    _.forEach(data, function(_filesystem) {  
                        if (_filesystem.name  in rdses) {  
                            _filesystem.rds = rdses[_filesystem.name].allocation_num;  
                        } else {
                            _filesystem.rds = '-';
                        }    
                    });      
 
                    hnas.filesystems = util.keyArray(data);  
 
                    reporting.hnasQuery("virtual-volume", baseFilters(), processVirtualVolume); 

                } else { 
                    $scope.status = "Allocation: 0" ; 
                }  
            } else if (type == "owner") {  
                hnas.owners  = util.keyArray(data);    
            }  

            checkInitProcess(serviceHnasTypes, type); 
        }; 

        /**
         * Callback function for fetching 'virtual-volume' data.
         * When finish request this data, this will assign an allocation name with RDS dta from CRM. 
         *  
         * @param {String} svc - 'hnas'
         * @param {String} type - service name (virtual-volume)
         * @param {Object} query - for next query
         * @param {Array} data - fetched data
         * @return {Void} 
         */ 
        var processVirtualVolume = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                Array.prototype.push.apply(hnas.virtualVolumes,  data);  
                $scope.status = "Loaded " + data.length + " virtual volumes.";  
                  
                var next = util.nextPage(query);
 
                reporting.hnasQuery("virtual-volume", next, processVirtualVolume);
            } else {   
     
                checkInitProcess(serviceHnasTypes, "virtual-volume");
                
                _.forEach(hnas.virtualVolumes, function(_virtualVolume) {  
                    if (_virtualVolume.filesystem in hnas.filesystems) { 
                        _virtualVolume.filesystemName = hnas.filesystems[_virtualVolume.filesystem].name;  
                    } 
                     
                    if (_virtualVolume.name in rdses) {
                        _virtualVolume.rds = rdses[_virtualVolume.name].allocation_num;  
                     } else {
                        _virtualVolume.rds = '-';
                    }
                });
            }
        }; 

        /**
         * When this page is requested, this fucnction is called automatically
         * to fetch basic XFS data ("snapshot", "host", "filesystem", "owner").
         *   
         * @return {Void}
         */ 
        var initXFS = function() { 
                
            reporting.xfsBase(function(svc, type, data) { 

                if (type == "snapshot") {
                    xfs.snapshots = util.keyArray(data); 
                    
                } else if (type == "host" && data) { 
                    xfs.host = util.keyArray(data);
                    
                    /** host pl-cml-nss-01.blue.ersa.edu.au is default */
                    xfsDefaultHost = data[0].id; 
                    
                } else if (type == "filesystem" && data) {             
                    _.forEach(data, function(_filesystem) {
                        
                        /** 
                         * This summary is for all host excluding only '/export/compellent/hpchome' filesystem 
                         * hpchomeFilesystem is used in query string with 'ne'
                         */
                        if (_filesystem.name.endsWith('/hpchome')) { 
                            hpchomeFilesystem = _filesystem.id;
                        }
                        
                        var fileName = _filesystem.name;
                        var idx = fileName.lastIndexOf("/");
                        if (idx > -1) {
                             fileName = fileName.substring(idx + 1);
                        } 
                        
                        if (fileName in rdses) {  
                            _filesystem.rds = rdses[fileName].allocation_num;  
                        } else {
                            _filesystem.rds = '-';
                        }   
                    }); 
 
                    xfs.filesystems = util.keyArray(data);     
                } else if (type == "owner" && data) {  
                    xfs.owners = util.keyArray(data); 
                }

                checkInitProcess(serviceXFSTypes, type); 
            });
        }; 

        /**
         * Display current processing name or finished work. 
         * 
         * @param {Array} serviceTypesArray - Service type array
         * @param {String} type - Service type to remove in serviceTypesArray
         * @return {Void}
         */  
        var checkInitProcess = function(serviceTypesArray, type) { 
            
            /** Find and remove item from serviceTypes array  */
            if (serviceTypesArray.indexOf(type) != -1) {
                serviceTypesArray.splice(serviceTypesArray.indexOf(type), 1);
                $scope.status = "Downloading "  + serviceXFSTypes + serviceHnasTypes; 
            }
            if (!serviceXFSTypes.length && !serviceHnasTypes.length) { 
                spinner.stop();
                $scope.status = "Initial data loaded.";
            }   
        }; 

        /**
         * initialize all variable
         */ 
        clear();

        /**
         * When this page is requested, this fucnction is called automatically
         * to fetch CRM data (orgainsation, user details, billing organisation).
         * 
         * @return {Void}
         */ 
        org.getOrganisations().then(function(_data) { 
            $scope.topOrgs = _data;  
            
            org.getAllUsers().then(function(_users) {    
                users = _users;      
            }); 

            org.getBillings().then(function(_billings) {    
                $scope.topOrgs = _billings;  
            });                 
        });     

        /**
         * When this page is requested, this fucnction is called automatically
         * to fetch initial HNAS and intial XFS data.
         * 
         * @return {Void}
         */ 
        org.getRoles().then(function(_roles) { 
            
            roles = _roles;
            org.getRdses().then(function(data) {  
                var _rdses = [];
                $scope.topRdsOrgs = [];
                _.forEach(data, function(rds) {
                    _rdses.push(rds.fields);                
                    var _rds = {"id" : rds.fields.allocation_num.substring(0, 4) , "name" : rds.fields.allocation_num.substring(0, 4)};
                    if (_.findWhere($scope.topRdsOrgs, _rds) == null) {
                        $scope.topRdsOrgs.push(_rds);
                    }
                }); 
                
                rdses = util.keyArray(_rdses, 'filesystem');
                
                initHnas();
                initXFS();
            });           
        });     
            
         
        /**
         * Assign user of organisation to RDS map.
         * rdses map will use to summarize usage by allocation name.
         * 
         * @return {Void}
         */ 
        var setOrganisationUsers = function() {    
            /** 'contrator' is a flag to execute this function only 1 time */
            if (rdses['contrator']) {
                return;
            } 
            
            var userAccountMap = {}; 
            _.forEach($scope.topOrgs, function(_org) {
                _.extend(userAccountMap, users[_org.pk]);   
            });
            
            userAccountMap = _.values(userAccountMap); 
            userAccountMap = util.keyArray(userAccountMap, 'personid');   
            
            _.forEach(roles, function(_role) {
                if (_role.fields.person in userAccountMap) { 
                   userAccountMap[_role.fields.person].contractor = _role.pk; 
                }
            });
            
            userAccountMap = _.values(userAccountMap); 
            userAccountMap = util.keyArray(userAccountMap, 'contractor');  
            
            var contrator = 0; 
            
            for (var key in rdses) {
                if (rdses[key].contractor in userAccountMap) {   
                    rdses[key].email = userAccountMap[rdses[key].contractor].email; 
                    rdses[key].fullname = userAccountMap[rdses[key].contractor].fullname; 
                    rdses[key].billing = userAccountMap[rdses[key].contractor].billing; 
                    rdses[key].school = userAccountMap[rdses[key].contractor].organisation; 
                    contrator++;
                }
            }
            
            if (contrator > 0) { 
                rdses['contrator'] = contrator;
            }  
            return;
        };     
             
        /**
         * Whe srganisation selected , this function is called
         * to update and display summary usages for the only organisation
         *  
         * @export 
         */ 
        $scope.orgChanged = function() {   
            updateAllUsages({'orgChanged' : $scope.selectedBillingOrg});   
        }; 
        
        
        /**
         * create TSV file data with summary data that has already fetched and stored.
         *  
         * @export
         * @return{Array} data
         */ 
        $scope.export = function() {
            var records = [];

            _.forEach($scope.usages, function(_usage) {
                records.push([
                    _usage.rds,
                    _usage.username, 
                    _usage.email, 
                    _usage.school, 
                    _usage.filesystem, 
                    _usage.approved_size, 
                    _usage.usage, 
                    _usage.quota250, 
                    _usage.usage == 0 ? 0 : Math.ceil(((_usage.usage / _usage.quota250).toFixed(2)) * 100),
                    $scope.formatNumber(_usage.per5dollar) + '.00'
                ]);
            }); 
            
            records = $filter('orderBy')(records, [0, 1]);
               
            var data = [
                ["Allocation", "User Name", "Email", "School", "File system", "RDS Allocated(GB)", "Currrent Usage(GB)", "250GB Quota Blocks", "%age Used of Quota", "$5 per 250GB"]
            ];
            Array.prototype.push.apply(data, records) ;
            
            /** Grand total data. */
            data.push([
                'Grand Total', 
                ' - ',  
                ' - ',  
                ' - ',  
                ' - ',  
                $scope.total.rds,
                $scope.total.currentUsage,
                $scope.total.quota250,
                $scope.total.currentUsage == 0 ? 0 : Math.ceil((($scope.total.currentUsage / $scope.total.quota250).toFixed(2)) * 100) + '%',
                '$' + $scope.formatNumber($scope.total.per5dollar) + '.00'
            ]); 
            
            return data;
        };


        /**
         * Request HNAS and XFS data with qeury string. 
         *  
         * @export
         */    
        $scope.load = function() {
            
            clear();
            
            setOrganisationUsers();
            
            $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
            $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd); 
              
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
             
            /** for calling updateAllUsages() when all requests complete */
            vuDeferred = $q.defer();
            fuDeferred = $q.defer();  
            xfsDeferred = $q.defer();  
            
            /** Once all requests completed, this call updateAllUsages() */
            $q.all([vuDeferred.promise, fuDeferred.promise, xfsDeferred.promise]).then(updateAllUsages);
            
            reporting.hnasQuery("snapshot", query, processHnasSnapshot);
        };
        
        /**
         * Request HNAS snapshot, and then call loadVirtualVolumeUsage(), loadFilesystemUsage and  loadXfsUsage.
         *  
         * @param {String} svc - service name ('hnas')
         * @param {String} type - 'snapshot'
         * @param {Object} query - for next query
         * @param {Array} data - fetched data
         * @return {Void}
         */ 
        var processHnasSnapshot = function(svc, type, query, data) { 
             
            spinner.start();
            
            hnas.snapshots = util.keyArray(data); 
            
            if (data && data.length > 0) { 
                
                $scope.status = "Loading filesystem usage ...";   
                var _param = data.map(function(s) { return s.id; }).join(",") ; 
                
                loadVirtualVolumeUsage(_param); 
                loadFilesystemUsage(_param);
                loadXfsUsage();
            } else {  
                $scope.status = "Loaded " + "0 hnas snapshots."; 
            } 
        };

        /**
         * Summarize virtualVolumeUsage, filesystemUsage and xfsUsage(excluding hpchome).
         * 
         * @return {Void}
         */ 
        var updateAllUsages = function() { 
            
            setOrganisationUsers();
            var rdsesMap = _.values(rdses); 
            rdsesMap = util.keyArray(rdsesMap, 'allocation_num'); 
            
            $scope.usages = {};
            /** ummarize virtualVolumeUsage, filesystemUsage and xfsUsage(excluding hpchome) */
            [cache.virtualVolumeUsage, cache.filesystemUsage, cache.xfsUsage].forEach(function(usages) {    
                 
                _.forEach(usages, function(_usage) {
                    if (invisible.join().indexOf(_usage.filesystem) > -1) {
                        return;
                    } 
                    
                    var _key =  $scope.filesystemChecked ? _usage.filesystem : _usage.rds;
                    if (!(_key in $scope.usages)) {
                        
                        $scope.usages[_key] = {       
                            source: _usage.source,
                            rds: _usage.rds,
                            username : '',
                            email : '',
                            billing : '',
                            school : '',
                            filesystem: $scope.filesystemChecked ? _usage.filesystem : '-', 
                            approvedSize : 0, 
                            quota250 : 0,
                            per5dollar : 0,
                            usage : 0
                        };
                    }

                    if (rdsesMap[_usage.rds]) { 
                        $scope.usages[_key].username = rdsesMap[_usage.rds].fullname;
                        $scope.usages[_key].email = rdsesMap[_usage.rds].email;
                        $scope.usages[_key].billing = rdsesMap[_usage.rds].billing;
                        $scope.usages[_key].school = rdsesMap[_usage.rds].school;
                        $scope.usages[_key].approvedSize = rdsesMap[_usage.rds].approved_size;
                    }
                    
                    if ($scope.selectedBillingOrg != '0') { 
                        if (!$scope.usages[_key].rds.startsWith($scope.selectedBillingOrg)) {
                            delete $scope.usages[_key];
                            return;
                        }
                    }
                                                      
                    if (_usage.usage) {
                        $scope.usages[_key].usage += _usage.usage * 1; 
                    }
                });   
            });   
            
            $scope.usages = _.values($scope.usages);  
            
            /** calulate grand total usage */
            $scope.total.rds = 0;
            $scope.total.currentUsage = 0;
            $scope.total.quota250 = 0;
            $scope.total.per5dollar = 0;
            
            _.forEach($scope.usages, function(_usage) {  
                _usage.usage = (_usage.usage / 1000).toFixed(2);
                _usage.quota250 = 250 * (window.Math.ceil(_usage.usage / 250));
                _usage.per5dollar = 5 * (window.Math.ceil(_usage.usage / 250));
           
                $scope.total.rds += _usage.approvedSize; 
                $scope.total.currentUsage += _usage.usage  * 1 ; 
                $scope.total.quota250 += _usage.quota250  * 1 ; 
                $scope.total.per5dollar += _usage.per5dollar * 1 ;
            });
             
            spinner.stop();
        };

        /**
         * Main function for call Virtural Volume Usage.
         * This create request query for it.
         *   
         * @param {String} _snapshotParams - snapshot string
         * @return {Void}
         */         
        var loadVirtualVolumeUsage = function(_snapshotParams) {  
            
            var filter =  {filter: ["snapshot.in." + _snapshotParams]};  
            var query = _.merge(baseFilters(), filter);


            $scope.status = "Loading ...";  
            reporting.hnasQuery("virtual-volume/usage", query, processVirtualVolumeUsage);     
        };

        /**
         * Callback function for fetching Virtual-Volume Usage of HNAS.
         *  
         * @param {String} svc - service name ('hans')
         * @param {String} type - 'virtual-volume usage'
         * @param {Object} query - for next query
         * @param {Array} data - fetched data
         * @return {Void}
         */     
        var processVirtualVolumeUsage = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                Array.prototype.push.apply(cache.virtualVolumeUsage, data);  
                $scope.status = "Loaded " + cache.virtualVolumeUsage.length + " usages."; 
                 
                var next = util.nextPage(query);
 
                reporting.hnasQuery("virtual-volume/usage", next, processVirtualVolumeUsage);
            } else {    
                cache.virtualVolumeUsage = mapVirtualVolumeUsage(cache.virtualVolumeUsage);
                cache.virtualVolumeUsage = _.values(cache.virtualVolumeUsage);  
                
                vuDeferred.resolve({'VirtualVolumeUsage': 'done'});
            } 
        };
                 
        /**
         * When request of VirtualVolumeUsage completed, this assign allocation name and owner for it.
         * And then, summarize it by virtual_volume_id.
         *   
         * @param {Array} data - Virtual-volume usage data
         * @return {Object} usageSummary
         */             
        var mapVirtualVolumeUsage = function(data) {  
            
            var virtualVolumeMap = util.keyArray(hnas.virtualVolumes);  
 
            var usageSummary = {}; 
            _.forEach(data, function(_usage) { 

                if (!(_usage.virtual_volume in usageSummary)) {
                    
                    usageSummary[_usage.virtual_volume] = {     
                        source: 'V',
                        rds: virtualVolumeMap[_usage.virtual_volume].rds,
                        virtualVolumeId: _usage.virtual_volume,                          
                        filesystem: virtualVolumeMap[_usage.virtual_volume].name,
                        filesystemName: virtualVolumeMap[_usage.virtual_volume].filesystem_name, 
                        usage : 0,
                        owner : '' 
                    }; 
                }           
                                
                if (_usage.virtual_volume in virtualVolumeMap) { 
                    if (_usage.usage && _usage.usage > usageSummary[_usage.virtual_volume].usage) {     
                        usageSummary[_usage.virtual_volume].usage = _usage.usage;  
                    }
                }
                  
                if (_usage.owner in hnas.owners) {
                    usageSummary[_usage.virtual_volume].owner = hnas.owners[_usage.owner].name;
                }
            });
            return usageSummary;
        };

        /**
         * Main function for call Filesystem Usage.
         * This create request query for it.
         *   
         * @param {String} _snapshotParams - snapshot string
         * @return {Void}
         */         
        var loadFilesystemUsage = function(_snapshotParams) {
            var filter =  {filter: ["snapshot.in." + _snapshotParams]};
            var query = _.merge(baseFilters(), filter); 

            $scope.status = "Loading ...";
            reporting.hnasQuery("filesystem/usage", query, processFilesystemUsage);
        }; 

        /**
         * Callback function for fetching Filesystem Usage of HNAS.
         *  
         * @param {String} svc - service name ('hans')
         * @param {String} type - 'filesystem usage'
         * @param {Object} query - for next query
         * @param {Array} data - fetched data
         * @return {Void}
         */        
        var processFilesystemUsage = function(svc, type, query, data) {
            
            if (data && data.length > 0) {
                Array.prototype.push.apply(cache.filesystemUsage, data);
                $scope.status = "Loaded " + cache.filesystemUsage.length + " usages";
                 
                var next = util.nextPage(query);
 
                reporting.hnasQuery("filesystem/usage", next, processFilesystemUsage);
            } else {
                cache.filesystemUsage = mapFilesystemUsage(cache.filesystemUsage);
                cache.filesystemUsage = _.values(cache.filesystemUsage);
                
                fuDeferred.resolve({'FilesystemUsag': 'done'});
            }
        };
                 
        /**
         * When request of Filesystem Usage completed, this assign allocation name for it.
         * And then, summarize it by filesystem_id.
         *   
         * @param {Array} data - Filesystem usage data
         * @return {Object} usageSummary
         */         
        var mapFilesystemUsage = function(data) {
            
            var filesystemMap = util.keyArray(hnas.filesystems);
            var usageSummary = {};
            _.forEach(data, function(_usage) { 

                if (!(_usage.filesystem in usageSummary)) {

                    usageSummary[_usage.filesystem] = { 
                        source: 'F',
                        rds: filesystemMap[_usage.filesystem].rds,
                        filesystemId: _usage.filesystem,
                        filesystem: filesystemMap[_usage.filesystem].name,  
                        usage : 0, //live_usage : 0 
                    };  
                }  
                                
                if (_usage.filesystem in filesystemMap) {    
                    if (_usage.live_usage && _usage.live_usage > usageSummary[_usage.filesystem].usage) { 
                        usageSummary[_usage.filesystem].usage = _usage.live_usage ; 
                    }  
                }                      
            });
            return usageSummary;
        };
           
        /**
         * Util function for filtering snapshots data to fetch
         * what is related with only 'pl-cml-nss-01.blue.ersa.edu.au' host. 
         *    
         * @return {Object} xfsSnapshots
         */      
        var getXfsHostSnapshots = function(_xfsDefaultHost) {  
            var xfsSnapshots = {};
            if (_xfsDefaultHost) {
                for (var key in xfs.snapshots) {
                    if (xfs.snapshots[key].host == _xfsDefaultHost) { 
                        xfsSnapshots[key] = xfs.snapshots[key];
                    }
                }
            } 
            return xfsSnapshots;        
        };

        /**
         * Util function for filtering filesystems data to fetch
         * what is related with only 'pl-cml-nss-01.blue.ersa.edu.au' host. 
         *    
         * @return {Object} xfsSnapshots
         */       
        var getXfsHostFilesystems = function(_xfsDefaultHost) {  
            var xfsFilesystems = {};
            if (_xfsDefaultHost) {
                for (var key in xfs.filesystems) {
                    if (xfs.filesystems[key].host == _xfsDefaultHost) { 
                        xfsFilesystems[key] = xfs.filesystems[key];
                    }
                }
            } 
            return xfsFilesystems;        
        };
                 
       
        /**
         * Main function for call XFS Usage ecluding 'hpchome'.
         * This create request query with snapshot for it.
         *    
         * @return {Void}
         */       
        var loadXfsUsage = function() {  
            
            var xfsSnapshots = getXfsHostSnapshots(xfsDefaultHost); 
            
            var t1 = util.dayStart($scope.rangeStart);
            var t2 = util.dayEnd($scope.rangeEnd);  
            
            var snapshots = _.filter(_.values(xfsSnapshots), function(snapshot) {
                return (snapshot.ts >= t1) && (snapshot.ts < t2);
            });
            
            snapshots.sort(function(s1, s2) {
                if (s1.id > s2.id) {
                    return 1;
                } else if (s1.id < s2.id) {
                    return -1;
                } else {
                    return 0;
                }
            });
             
            var timestamps = snapshots.map(function(s) { return s.ts; });

            var earlierSnapshots = _.values(xfsSnapshots).filter(function(s) {
                return s.ts < t1;
            });

            if (earlierSnapshots.length > 0) {
                earlierSnapshots = util.keyArray(earlierSnapshots, "ts");

                var ts = math.max(_.keys(earlierSnapshots).map(function(i) { return parseInt(i); }));

                snapshots.push(earlierSnapshots[ts]);
                timestamps.push(ts);
            }

            $scope.select.snapshots = snapshots;
            $scope.select.timestamps = math.sort(timestamps);

            if (snapshots.length === 0) {
                $scope.status = "No snapshots in that range.";
                return;
            } 

            var query = { count: 80000,  page: 1};

            query.filter = [
                "snapshot.in." + snapshots.map(function(s) { return s.id; }).join(","),
                "filesystem.ne." + hpchomeFilesystem
            ]; 

            $scope.status = "Loading ...";
            $scope.jobCount = 0;

            reporting.xfsQuery("usage", query, processXfsUsageRange);
            
        };
         

        /**
         * Callback function for fetching usage of XFS.
         *  
         * @param {String} svc - service name ('xfs')
         * @param {String} type - 'usage'
         * @param {Object} query - for next query
         * @param {Array} data - fetched data
         * @return {Void}
         */  
        var processXfsUsageRange = function(svc, type, query, data) {
            
            if (data && data.length > 0) {
                Array.prototype.push.apply(cache.xfsUsage, data);

                $scope.status = "Loaded " + cache.xfsUsage.length + " usage records.";

                var next = util.nextPage(query);

                reporting.xfsQuery("usage", next, processXfsUsageRange);
            } else {
                 
                $scope.status = "Usage records: " + cache.xfsUsage.length + ". Snapshots: " + $scope.select.snapshots.length + ".";
                
                cache.xfsUsage = mapXfsUsage(cache.xfsUsage);
                xfsDeferred.resolve({'XfsUsage': 'done'});
            } 
        };         
         
        /**
         * When request of XFS Usage completed, this assign allocation name of RDS for it.
         * And then, summarize it by filesystem_id.
         *   
         * @param {Array} data - Usage data
         * @return {Object} usageSummary
         */         
        var mapXfsUsage  = function(data) {

            if (data.length === 0) { 
                return;
            }

            var xfsSnapshots = getXfsHostSnapshots(xfsDefaultHost); 
            var xfsFilesystems = getXfsHostFilesystems(xfsDefaultHost);
            
            var t1 = util.dayStart($scope.rangeStart);
            var t2 = util.dayEnd($scope.rangeEnd);

            var weights = util.durationWeight(t1, t2, $scope.select.timestamps); 
 
            var summed = {};
            
            _.forEach(data, function(record) {
                var _sumeKey = record.filesystem; 
                if (!(_sumeKey in summed)) {
                    summed[_sumeKey] = {
                        rds: xfsFilesystems[_sumeKey].rds, 
                        filesystem: xfsFilesystems[_sumeKey].name, 
                        school: "",
                        organisation: "", 
                        usage: 0,
                        peak: 0
                    };  
                }                
                  
                var recordUsage = record.usage;  
                var userSum = summed[_sumeKey]; 
                var snapshot = xfsSnapshots[record.snapshot]; 
                var weightedUsage = weights[snapshot.ts] * recordUsage; 
                userSum.usage += weightedUsage;

                if (recordUsage > userSum.peak) {
                    userSum.peak = recordUsage;
                } 
            });  
            
            /** clear cached memory */ 
            var summedByRds = {};  
            
            _.forEach(summed, function(entry) {

                if (!(entry.filesystem in summedByRds)) {
                    summedByRds[entry.filesystem] = {
                        source: 'X',
                        rds: entry.rds,   
                        filesystem: entry.filesystem,
                        username: '',
                        usage: 0,
                        peak: 0
                    };
                }
 
                if (entry.usage && entry.usage > summedByRds[entry.filesystem].usage) {  
                    if (entry.usage > (1024 * 1024) + 1) { 
                        summedByRds[entry.filesystem].usage  = (entry.usage / (1024 * 1024)).toFixed(2); 
                    } else {
                        summedByRds[entry.filesystem].usage  = 0;
                    }
                }
                if (entry.peak > summedByRds[entry.filesystem].peak) {
                    summedByRds[entry.filesystem].peak = entry.peak;
                } 
            }); 
             
            return _.values(summedByRds); 
        };         
           
                      
    }]);   
});

