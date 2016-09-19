
define({"ersa" : {
            "HPC": { 
                "HPC": ["/hpc/hpc", "HPC", "tesla gpu gtx mecheng abraham short gtx3 "],
                "Summary": ["/hpc/hpcsummary", "HPCSummary", "tesla gpu gtx mecheng abraham short gtx3 "], 
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
                "Virtual Machines (Nova)": ["nova"],
                "Cloud Summary": ["/cloud/novasummary", "Novasummary"], 
            }
        },
        "portal" : {
                "Service": { 
                    "HPC": ["https://www.ersa.edu.au/services/", "Service"],
                    "Summary": ["/hpc/hpcsummary", "HPCSummary", "tesla gpu gtx mecheng abraham short gtx3 "], 
                },
                "aStorage": {
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
                "aCloud": {
                    "Identity (Keystone)": ["/cloud/keystone", "Keystone"],
                    "Virtual Machines (Nova)": ["nova"],
                    "Cloud Summary": ["/cloud/novasummary", "Novasummary"], 
                }
        } 
});
