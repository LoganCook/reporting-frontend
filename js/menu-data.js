define(function (require, exports, module) {module.exports = {
        "Identity": {
            "CRM": ["/identity/crm", "CRM"]
        },
        "Business": {
            "Business": ["/business/business", "Business"]
        },
        "HPC": {
            "HPC": ["/hpc/hpc", "HPC"]
        },
        "Storage": {
            "Filesystem": ["/storage/fs", "Filesystem"],
            "XFS": ["/storage/xfs", "XFS"],
            "HNAS": ["/storage/hnas", "HNAS"],
            "HCP": ["/storage/hcp", "HCP"]
        },
        "Cloud": {
            "Identity (Keystone)": ["/cloud/keystone", "Keystone"],
            "Virtual Machines (Nova)": ["/cloud/nova", "Nova"],
            "Block Storage (Cinder)": ["/cloud/cinder", "Cinder"],
            "Object Storage (Swift)": ["/cloud/swift", "Swift"]
        }
    };

});
