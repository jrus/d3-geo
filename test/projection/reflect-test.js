var tape = require("tape"),
    d3 = require("../../");

require("../inDelta");
require("./projectionEqual");

tape("projection.reflectX(…) defaults to false", function(test) {
  var projection = d3.geoGnomonic().scale(1).translate([0, 0]);
  test.equal(projection.reflectX(), false);
  test.equal(projection.reflectY(), false);
  test.projectionEqual(projection, [0, 0], [0, 0]);
  test.projectionEqual(projection, [10, 0], [0.17632698070846498, 0]);
  test.projectionEqual(projection, [0, 10], [0, -0.17632698070846498]);
  test.end();
});

tape("projection.reflectX(…) mirrors x after projecting", function(test) {
  var projection = d3.geoGnomonic().scale(1).translate([0, 0]).reflectX(true);
  test.equal(projection.reflectX(), true);
  test.projectionEqual(projection, [0, 0], [0, 0]);
  test.projectionEqual(projection, [10, 0], [-0.17632698070846498, 0]);
  test.projectionEqual(projection, [0, 10], [0, -0.17632698070846498]);
  projection.reflectX(false).reflectY(true);
  test.equal(projection.reflectX(), false);
  test.equal(projection.reflectY(), true);
  test.projectionEqual(projection, [0, 0], [0, 0]);
  test.projectionEqual(projection, [10, 0], [0.17632698070846498, 0]);
  test.projectionEqual(projection, [0, 10], [0, 0.17632698070846498]);
  test.end();
});

tape("projection.reflectX(…) works with projection.angle()", function(test) {
  var projection = d3.geoMercator().scale(1).translate([10, 20]).reflectX(true).angle(45);
  test.equal(projection.reflectX(), true);
  test.inDelta(projection.angle(), 45);
  test.projectionEqual(projection, [0, 0], [10, 20]);
  test.projectionEqual(projection, [10, 0], [9.87658658, 20.12341341]);
  test.projectionEqual(projection, [0, 10], [9.87595521, 19.87595521]);
  test.end();
});
