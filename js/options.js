define({
  nova: {
    domains: ["Flinders", "Adelaide", "UniSA"],
    pickers: [{
      title: 'Start',
      class: 'col-md-3',
      date: new Date(Date.now() - 86400000)
    }, {
      title: 'End',
      class: 'col-md-3',
      date: new Date()
    }],
    size: 10,
    price: 120
  },
  domains: {
    'unisa.edu.au': 'University of South Australia',
    'adelaide.edu.au': 'University of Adelaide',
    'flinders.edu.au': 'Flinders University'
  },
  hpc: {
    IncompleteMonth: 'The cost of current month is not accurate.'
  },
  "hpchome": {
    "price": 5
  },
  "product-composition": {
    "tangocloudvm": {
      "core": "tangovmcpunotforsale",
      "ram": "tangovmmemorynotforsale"
    }
  }
});
