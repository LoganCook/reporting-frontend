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
    price: 10
  },
  domains: {
    'unisa.edu.au': 'University of South Australia',
    'adelaide.edu.au': 'University of Adelaide',
    'flinders.edu.au': 'Flinders University'
  },
  hpc: {
    payees: ['University of South Australia', 'University of Adelaide', 'Flinders University'],
    sharedAmount: 60000,
    IncompleteMonth: 'The cost of current month is not accurate.'
  }
});
