# Linjakartta (route map app)

This app is a pretty simple map application, that shows the routes of selected date in HSL area. The map is the vector map of HSL and implemented on Mapbox GL.

## Installation and development

Requirements
- node (v18 or newer preferred)
- yarn package manager

Create your own apikey for Digitransit (https://portal-dev-api.digitransit.fi)
Copy .env.local to .env and place your apikey to `DIGITRANSIT_APIKEY` variable.

Install:
```
yarn
```

Start a development server:
```
yarn start
```
or in auto-reload mode:
```
yarn watch
```
