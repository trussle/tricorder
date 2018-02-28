# Tricorder

[![Build Status](https://travis-ci.org/trussle/tricorder.svg?branch=master)](https://travis-ci.org/trussle/tricorder)

[![Coverage Status](https://coveralls.io/repos/github/trussle/tricorder/badge.svg?branch=travis-ci)](https://coveralls.io/github/trussle/tricorder?branch=travis-ci)

[Express](https://github.com/expressjs/express) middleware to provide basic metrics to [Prometheus](https://prometheus.io).

Prometheus is an open source monitoring solution that obtains metrics from servers by querying against the `/metrics` endpoint upon them.

Once instrumented, Tricorder automatically serves response duration metrics,  nodejs system and garbage collection metrics on the `/metrics` endpoint ready to be consumed by Prometheus.

The inbuilt metrics are the basics you'll need to gain insight into your application and conforming to [best practise](https://prometheus.io/docs/practices/naming/).

## Installation and Setup

```bash
npm install @trussle/tricorder --save
```

Installation into an express application;

```js
const express = require("express");
const tricorder = require("@trussle/tricorder");
const app = express();

tricorder.instrument(app);
```

## API

Tricorder exposes;

* `instrument(Express, options)` - used to add metrics to your express server
* `client()` - expose `prom-client` for use throughout your application

### Options

The options object supports the following properties;

* url - metrics url defaults to `/metrics`

## Metrics

### Http

* http_requests_processing (gauge)
* http_requests_total{labels} (counter)
* http_request_duration_seconds{labels} (histogram) - count duration in `prom-client` default buckets

When labels are indicated as in included they will be as follows;

* status: the http status code of the response, e.g. 200, 500
* method: the http method of the request, e.g. put, post.
* path: the path of the request. Note that /users/freddie is labelled /users/:id so not to create a large number of timeseries 

### System

These are metrics provided by [prom-client](https://github.com/siimon/prom-client) that instrument the nodejs heap/rss usage and cpu usage etc.

### Garbage Collection

These are metrics provided by [prometheus-gc-stats](https://github.com/SimenB/node-prometheus-gc-stats) that instrument the nodejs gc.

## Why

The node/express eco-system already has a collection of Prometheus middleware implementations which don't all conform to best practise making metrics hard to consume and use to drive alerting.

Tricorder is designed to be the swiss army knife of metrics providing everything you need to get started in an easy to consume package.