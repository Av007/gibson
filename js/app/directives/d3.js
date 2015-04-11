angular.module('app.d3')
    .directive('d3', function($parse, $window) {
        return {
            restrict: 'EA',
//            transclude: true,
//            replace: true,
            scope: {
                data: "=",
                label: "@"
            },
            link: function(scope, iElement, iAttrs) {
                var progress = 0,
                    total = 100,
                    d3 = $window.d3,
                    formatPercent = d3.format(".0%");

                var options = {
                    width: 250,
                    height: 250,
                    innerArea: {
                        areaSpeed: 0.1,
                        circleRadius: 85,
                        arcsCount: 3,
                        arcsRadius: 8,
                        arcsAngularGap: 15,
                        arcsPadding: 10,
                        glow: {
                            innerRadius: 110,
                            outerRadius: 90,
                            x: 7,
                            y: 7
                        }
                    }
                };

                var arc = d3.svg.arc()
                    .startAngle(0)
                    .innerRadius(80)
                    .outerRadius(90);

                var svg = d3.select(iElement[0]).append("svg")
                    .attr("width", options.width)
                    .attr("height", options.height)
                    .attr('fill', '#AACCFF')
                    .append("g")
                    .attr("transform", "translate(" + options.width / 2 + "," + options.height / 2 + ")");

                svg.append("svg")
                    .attr("width", options.width)
                    .attr("height", options.height);

                //center = {x: options.width / 2, y: options.height / 2};
                center = {x: 0, y: 0};

                // Filters
                svg
                    .append("defs")
                    .append("filter")
                    .attr("id", "inner-glow")
                    .append("feGaussianBlur")
                    .attr("in", "SourceGraphic")
                    .attr("stdDeviation", options.innerArea.glow.x + " " + options.innerArea.glow.y);

                var g = svg
                    .append("g");

                var innerArea = g.append("g")
                    .attr("id", "inner-area");

                // Glowing arc
                innerArea.append("path")
                    .attr("id", "inner-glowing-arc")
                    .attr("transform", "translate(" + center.x + "," + center.y + ")")
                    .attr("d", d3.svg.arc()
                        .innerRadius(options.innerArea.glow.innerRadius)
                        .outerRadius(options.innerArea.glow.outerRadius)
                        .startAngle(0)
                        .endAngle(2 * Math.PI))
                    .style("fill", "rgba(13,215,247, .9)")
                    .attr("filter", "url(#inner-glow)");
                // end fileter

                // another path
                var paddings = options.innerArea.arcsCount * options.innerArea.arcsAngularGap,
                    arcAngularSize = (360 - paddings) / options.innerArea.arcsCount;

                // Inner surrounding arcs
                var innerArcs = innerArea.append("g");

                Number.prototype.degsToRads = function () {
                    return d3.scale.linear().domain([0, 360]).range([0, 2 * Math.PI])(this);
                };

                innerArcs.selectAll("path")
                    .data(d3.range(options.innerArea.arcsCount + 1))
                    .enter()
                    .append("path")
                    .style("fill", "rgb(13,215,247)")
                    .attr("transform", "translate(" + center.x + "," + center.y + ")" +
                    "rotate(" + (180 - options.innerArea.arcsAngularGap / 2) + ")")
                    .attr("d", function(d, i){

                        var _innerRadius = options.innerArea.circleRadius + options.innerArea.arcsPadding,
                            startAngle = (arcAngularSize * i + options.innerArea.arcsAngularGap * (i + 1)).degsToRads(),
                            endAngle = arcAngularSize.degsToRads() + startAngle;

                        return d3.svg.arc()
                            .innerRadius(_innerRadius)
                            .outerRadius(_innerRadius + options.innerArea.arcsRadius)
                            .startAngle(startAngle)
                            .endAngle(endAngle)();
                    });
                // end another path

                // last
                var t0 = Date.now(),
                    t = "translate(" + center.x + "," + center.y + ") ";

                function reverseArcTransition(arc, rev) {
                    arc.transition()
                        .duration(function(d){ return d.duration })
                        .ease('linear')
                        .attrTween("transform", function(d) {
                            return (rev ? d3.interpolate(t + "rotate(" + (d.reverse ? 360 : -360) + ")", t + "rotate(0)")
                                : d3.interpolate(t + "rotate(0)", t + "rotate(" + (d.reverse ? 360 : -360) + ")"));
                        })
                        .each("end", function() {
                            d3.select(this).call(reverseArcTransition, !rev);
                        });
                }

                d3.timer(function () {
                    var delta = Date.now() - t0;
                    innerArcs.attr("transform", function() {
                        return "rotate(" + delta * options.innerArea.areaSpeed + "," + center.x + "," + center.y + ")";
                    });
                });
                // end last

                var meter = svg.append("g")
                    .attr("class", "progress-meter");

                meter.append("path")
                    .attr("class", "background")
                    .attr("d", arc.endAngle(2 * Math.PI));

                var foreground = meter.append("path")
                    .attr("class", "foreground");

                var text = meter.append("text")
                    .attr("text-anchor", "middle");

                var text2 = meter.append("text")
                    .attr("y", 20)
                    .attr("text-anchor", "middle")
                    .attr("class", "text2");

                text2.text('progress completed');

                var animate = function (percentage) {
                    var i = d3.interpolate(progress, percentage);

                    d3.transition().duration(1200).tween("progress", function () {
                        return function (t) {
                            progress = i(t);
                            foreground.attr("d", arc.endAngle(2 * Math.PI * progress));
                            text.text(formatPercent(progress));
                        };
                    });
                };

                animate(iElement[0].getAttribute("data-value"));
            }
        }
    });
