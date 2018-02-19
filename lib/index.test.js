const supertest = require("supertest");
const express = require("express");
const tricorder = require("./index");

describe("index", () => {
  let sut;

  describe("options", () => {
    beforeEach(() => {
      sut = express();
    });

    test("When not given url, should default to metrics", () => {
      // Arrange
      tricorder.instrument(sut);
      // Act
      return supertest(sut)
        .get("/metrics")
        .then(result => {
          // Assert
          expect(result.statusCode).toBe(200);
        });
    });

    test("When given url, should default to url value", () => {
      // Arrange
      const options = {
        url: "/metric-route"
      };
      tricorder.instrument(sut, options);

      // Act
      return supertest(sut)
        .get(options.url)
        .then(result => {
          // Assert
          expect(result.statusCode).toBe(200);
        });
    });
  });

  describe("metrics", () => {
    let agent;

    beforeEach(() => {
      sut = express();
      tricorder.instrument(sut);

      sut.get("/resource", (req, res) => {
        res.send();
      });

      sut.get("/resource/:id", (req, res) => {
        res.send();
      });

      agent = supertest.agent(sut);
    });

    describe("http_requests_processing", () => {
      test("Given metrics are running, should include http_requests_processing", () => {
        // Arrange
        // Act
        return agent.get("/resource").then(() => {
          return agent.get("/metrics").then(result => {
            expect(result.statusCode).toBe(200);
            expect(result.headers["content-type"]).toBe(
              "text/plain; charset=utf-8"
            );
            expect(result.text).toContain("http_requests_processing 0");
          });
        });
      });
    });

    describe("http_requests_total", () => {
      test("Given resource has been request, should being included in http_requests_total", () => {
        // Arrange
        // Act
        return agent.get("/resource").then(() => {
          return agent.get("/metrics").then(result => {
            expect(result.statusCode).toBe(200);
            expect(result.headers["content-type"]).toBe(
              "text/plain; charset=utf-8"
            );
            expect(result.text).toContain(
              'http_requests_total{method="GET",path="/resource",status="200"} 2'
            );
          });
        });
      });

      test("Given resource/:id has been request, should being included in http_requests_total", () => {
        // Arrange
        const id = 8;

        // Act
        return agent.get(`/resource/${id}`).then(() => {
          return agent.get("/metrics").then(result => {
            expect(result.statusCode).toBe(200);
            expect(result.headers["content-type"]).toBe(
              "text/plain; charset=utf-8"
            );
            expect(result.text).toContain(
              'http_requests_total{method="GET",path="/resource/:id",status="200"} 1'
            );
          });
        });
      });
    });

    describe("http_request_duration_seconds", () => {
      test("Given resource has been request, should being included in http_request_duration_seconds", () => {
        // Arrange
        // Act
        return agent.get("/resource").then(() => {
          return agent.get("/metrics").then(result => {
            expect(result.statusCode).toBe(200);
            expect(result.headers["content-type"]).toBe(
              "text/plain; charset=utf-8"
            );
            expect(result.text).toContain(
              'http_request_duration_seconds_bucket{le="10",method="GET",path="/resource",status="200"} 3'
            );
          });
        });
      });

      test("Given resource/:id has been request, should being included in http_request_duration_seconds", () => {
        // Arrange
        const id = 3;

        // Act
        return agent.get(`/resource/${id}`).then(() => {
          return agent.get("/metrics").then(result => {
            expect(result.statusCode).toBe(200);
            expect(result.headers["content-type"]).toBe(
              "text/plain; charset=utf-8"
            );
            expect(result.text).toContain(
              'http_request_duration_seconds_bucket{le="10",method="GET",path="/resource/:id",status="200"} 2'
            );
          });
        });
      });
    });

    describe("third party metrics", () => {
      test("Given metrics running, should include gc metrics", () => {
        // Arrange
        // Act
        return agent.get("/metrics").then(result => {
          // Assert
          expect(result.text).toContain("nodejs_gc_runs_total");
          expect(result.text).toContain("nodejs_gc_pause_seconds_total");
          expect(result.text).toContain("nodejs_gc_reclaimed_bytes_total");
        });
      });

      test("Given metrics running, should include default node metrics", () => {
        // Arrange
        // Act
        return agent.get("/metrics").then(result => {
          // Assert
          expect(result.text).toContain("nodejs_active_handles_total");
          expect(result.text).toContain("nodejs_active_requests_total");
          expect(result.text).toContain("nodejs_external_memory_bytes");
        });
      });
    });
  });
});
