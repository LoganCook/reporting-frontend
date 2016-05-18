define({"ersa" : {
                "HPC": { 
                    "HPC": ["/hpc/hpc", "HPC"],
                    "Summary": ["/hpc/hpcsummary", "HPCSummary"], 
                },
                "Storage": {
                    //"Filesystem": ["/storage/fs", "Filesystem"],
                    "XFS": ["/storage/xfs", "XFS"],
                    "HPC Storage": ["/storage/hpcStorage", "HPCStorage"],
                    //"HNAS": ["/storage/hnas", "HNAS"],
                    "HNAS": ["sub", ["/storage/hnas/fileSystem", "FileSystem"], ["/storage/hnas/virtualVolume","VirtualVolume"],], 
                    //"HNAS/FileSystem": ["/storage/hnas/fileSystem", "FileSystem"],
                    //"HNAS/VirtualVolume": ["/storage/hnas/virtualVolume", "VirtualVolume"],
                    "HCP": ["/storage/hcp", "HCP"],
                    "Allocation Summary": ["/storage/allocationSummary", "AllocationSummary"],
                },
                "Cloud": {
                    "Identity (Keystone)": ["/cloud/keystone", "Keystone"],
                    "Virtual Machines (Nova)": ["/nova"],
                    "Cloud Summary": ["/cloud/novasummary", "Novasummary"], 
                },
                "hideFor3rdMenu": {
                    "FileSystem": ["/storage/hnas/fileSystem", "FileSystem"], 
                    "VirtualVolume": ["/storage/hnas/virtualVolume","VirtualVolume"], 
                }
        },
        "portal" : {
                "Reports": { 
                    "COMPUTING": ["sub1", ["/hpc/hpcsummary", "HPC"], ["/cloud/novasummary", "NECTAR"],], 
                    "STORAGE": ["sub2", ["/storage/hpcStorage", "HPC"], ["/storage/allocationSummary", "ALLOCATION"],],  
                },
                "Help": { "exurl": "http=www.ersa.edu.au/case/studies"
                }, 
                "Support": { "exurl": "http=www.ersa.edu.au/case/studies"
                }, 
                "CASE STUDIES": { "exurl": "http=www.ersa.edu.au/case/studies"
                }, 
                "hideFor3rdMenu": {// this data will be registered in 'state'
                    "SummaHPry": ["/hpc/hpcsummary", "HPCSummary", "tesla gpu gtx mecheng abraham short gtx3 "], 
                    "HPC Storage": ["/storage/hpcStorage", "HPCStorage"],
                    "Allocation Summary": ["/storage/allocationSummary", "AllocationSummary"],
                    "Cloud Summary": ["/cloud/novasummary", "Novasummary"], 
                }
        } 
});
