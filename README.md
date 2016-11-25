# IoT Smell

## requirements
Node.js installed

## install
npm install

## configure
edit data/config.json file
  - url: URL of pripoj.me REST API
  - token: security authentication token for propoj.me access verification
  - proxy: (OPTIONAL)proxy server address
  - cache_timeout: Cache expiration timeout in ms.

## run
npm run start

The application runs on port defined in environmental variable PORT (3000 by default).