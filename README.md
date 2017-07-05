# reporting-frontend [![Build Status](https://travis-ci.org/eResearchSA/reporting-frontend.svg)](https://travis-ci.org/eResearchSA/reporting-frontend)

# Requirements
 1. nodejs/npm 6.x or higher
 1. internet access because some assets are pulled from portal.ersa.edu.au

# Getting started
 1. clone the repo
 1. cd reporting-frontend/
 1. npm i # will install all dependencies
 1. npm run dev # starts the dev server

# Prepare a deployment package to a clean machine

On a machine with `npm` installed, run these commands to create a tar ball:

```shell
mkdir source
curl -sL https://github.com/eResearchSA/reporting-frontend/archive/dev.tar.gz | tar -xz --strip-components=1 -C source
cd source
npm install --production

tar -czvf reporting-frontend-deployment.tar.gz favicon.ico img index.html template css js lib node_modules
```

After copy the package file to a new production location, say *testdir* of a web server html directory, run:

`tar -xzf reporting-frontend-deployment.tar.gz -C testdir`

## Note
HPC Home storage has a blacklist which has user names in it. So edit it in [js/properties.js](js/properties.js)
with real user names to be excluded.