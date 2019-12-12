const client = require("prom-client");
const gcStats = require("prometheus-gc-stats");
const cluster = require("cluster");

client.collectDefaultMetrics();
gcStats(client.register)();

const metric = {
  http: {
    requests: {
      clients: new client.Gauge({
        name: "http_requests_processing",
        help: "Http requests in progress",
        labelNames: ["method", "path", "status"]
      }),
      throughput: new client.Counter({
        name: "http_requests_total",
        help: "Http request throughput",
        labelNames: ["method", "path", "status"]
      }),
      duration: new client.Histogram({
        name: "http_request_duration_seconds",
        help: "Request duration histogram in seconds",
        labelNames: ["method", "path", "status"]
      })
    }
  }
};

function defaultOptions(options) {
  options = options || {};
  options.url = options.url || "/metrics";
  options.timestamps = options.timestamps || false;
  return options;
}

function instrument(server, options) {
  const opt = defaultOptions(options);

  function middleware(req, res, next) {
    if (req.path !== opt.url) {
      const end = metric.http.requests.duration.startTimer();
      metric.http.requests.clients.inc(1, Date.now());

      res.on("finish", function() {
        const labels = {
          method: req.method,
          path: req.route ? req.baseUrl + req.route.path : req.path,
          status: res.statusCode
        };

        if (opt.timestamps) {
          metric.http.requests.clients.dec(1, Date.now());
          metric.http.requests.throughput.inc(labels, 1, Date.now());
        } else {
          metric.http.requests.clients.dec(1);
          metric.http.requests.throughput.inc(labels, 1);
        }
        end(labels);
      });
    }

    return next();
  }

  server.use(middleware);

  if (cluster.isMaster) {
    const aggregatorRegistry = new client.AggregatorRegistry();

    server.get(opt.url, (req, res) => {
      aggregatorRegistry.clusterMetrics((err, metrics) => {
        if (err) console.log(err);
        res.set('Content-Type', aggregatorRegistry.contentType);
        res.send(metrics);
      });
    });
  } else {
    server.get(opt.url, (req, res) => {
      res.header("content-type", "text/plain; charset=utf-8");
      return res.send(client.register.metrics(opt.timestamps));
    });
  }
}
module.exports = {
  client,
  instrument
};
