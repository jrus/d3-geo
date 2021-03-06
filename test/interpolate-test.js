var tape = require("tape"),
    d3 = require("../");

require("./inDelta");

tape("geoInterpolate(a, a) returns a", function(test) {
  test.deepEqual(d3.geoInterpolate([140.63289, -29.95101], [140.63289, -29.95101])(0.5), [140.63289, -29.95101]);
  test.end();
});

tape("geoInterpolate(a, b) returns the expected values when a and b lie on the equator", function(test) {
  test.inDelta(d3.geoInterpolate([10, 0], [20, 0])(0.5), [15, 0], 1e-6);
  test.inDelta(d3.geoInterpolate([10, 0], [20, 0])(0), [10, 0], 1e-6);
  test.inDelta(d3.geoInterpolate([10, 0], [20, 0])(1), [20, 0], 1e-6);
  test.end();
});

tape("geoInterpolate(a, b) returns the expected values when a and b lie on a meridian", function(test) {
  test.inDelta(d3.geoInterpolate([10, -20], [10, 40])(0.5), [10, 10], 1e-6);
  test.inDelta(d3.geoInterpolate([10, -20], [10, 40])(0), [10, -20], 1e-6);
  test.inDelta(d3.geoInterpolate([10, -20], [10, 40])(1), [10, 40], 1e-6);
  test.end();
});

tape("geoInterpolate(a, b) passes through the pole when a and b are opposite each-other", function(test) {
  test.inDelta(d3.geoInterpolate([30, -30], [-150, -30])(0.5)[1], -90, 1e-6);
  test.inDelta(d3.geoInterpolate([30, 30], [-150, 30])(0.5)[1], 90, 1e-6);
  test.end();
});

tape("geoInterpolate(a, b) works when a or b is at either pole", function(test) {
  test.inDelta(d3.geoInterpolate([60, -90], [30, -50])(0.5), [30, -70], 1e-6);
  test.inDelta(d3.geoInterpolate([60, -90], [30, -50])(0)[1], -90, 1e-6);  
  test.inDelta(d3.geoInterpolate([60, -90], [30, -50])(1),[30, -50], 1e-6);
  
  test.inDelta(d3.geoInterpolate([30, -50], [60, -90])(0.5), [30, -70], 1e-6);
  test.inDelta(d3.geoInterpolate([30, -50], [60, -90])(0),[30, -50], 1e-6);
  test.inDelta(d3.geoInterpolate([30, -50], [60, -90])(1)[1], -90, 1e-6);  
  
  test.inDelta(d3.geoInterpolate([60, 90], [30, 50])(0.5), [30, 70], 1e-6);
  test.inDelta(d3.geoInterpolate([60, 90], [30, 50])(0)[1], 90, 1e-6);
  test.inDelta(d3.geoInterpolate([60, 90], [30, 50])(1), [30, 50], 1e-6);

  test.inDelta(d3.geoInterpolate([30, 50], [60, 90])(0.5), [30, 70], 1e-6);
  test.inDelta(d3.geoInterpolate([30, 50], [60, 90])(0), [30, 50], 1e-6);
  test.inDelta(d3.geoInterpolate([30, 50], [60, 90])(1)[1], 90, 1e-6);
  test.end();
});
