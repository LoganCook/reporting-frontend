define({
        //"Identity": {
        //    "CRM": ["/identity/crm", "CRM"]
        //},
        //"Business": {
        //    "Business": ["/business/business", "Business"]
        //},
        "HPC": {
            "HPC": ["/hpc/hpc", "HPC"]
        },
        "Storage": {
            //"Filesystem": ["/storage/fs", "Filesystem"],
            "XFS": ["/storage/xfs", "XFS"],
            //"HNAS": ["/storage/hnas", "HNAS"],
            "HNAS/FileSystem": ["/storage/hnas/fileSystem", "FileSystem"],
            "HNAS/VirtualVolume": ["/storage/hnas/virtualVolume", "VirtualVolume"],
            "HCP": ["/storage/hcp", "HCP"]
        },
        "Cloud": {
            "Identity (Keystone)": ["/cloud/keystone", "Keystone"],
            "Virtual Machines (Nova)": ["nova"],
            //"Block Storage (Cinder)": ["/cloud/cinder", "Cinder"],
            //"Object Storage (Swift)": ["/cloud/swift", "Swift"]
        }
});
