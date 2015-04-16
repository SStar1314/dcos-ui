/** @jsx React.DOM */

var _ = require("underscore");
var d3 = require("d3");
var React = require("react/addons");

var DialSlice = require("./DialSlice");
var InternalStorageMixin = require("../../mixins/InternalStorageMixin");

var DialChart = React.createClass({

  displayName: "DialChart",

  mixins: [InternalStorageMixin],

  propTypes: {
    // [{colorIndex: 0, name: "Some Name", value: 4}]
    data: React.PropTypes.array.isRequired,
    duration: React.PropTypes.number,
    unit: React.PropTypes.number,
    label: React.PropTypes.string,
    value: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      duration: 1000,
      label: "",
      value: "value"
    };
  },

  componentWillMount: function () {
    var value = this.props.value;
    var data = _.extend({
      pie: d3.layout.pie()
        .sort(null)
        .value(function(d) { return d[value]; })
    }, this.getArcs(this.props));

    this.internalStorage_set(data);
  },

  shouldComponentUpdate: function (nextProps) {
    var slice = this.getSlice(this.props);
    var arcs = this.getArcs(this.props);
    var innerArc = arcs.innerArc;

    slice.each(function(d) { this._current = d; });

    slice = this.getSlice(nextProps);
    slice.transition()
      .duration(nextProps.duration)
      .attrTween("d", function (d) {
      var interpolate = d3.interpolate(this._current, d);
      var _this = this;
      return function(t) {
        _this._current = interpolate(t);
        return innerArc(_this._current);
      };
    });

    return true;
  },

  getSlice: function(props) {
    var data = this.internalStorage_get();
    return d3.select(this.getDOMNode()).selectAll("path")
      .data(data.pie(props.data));
  },

  getArcs: function(props) {
    var radius = props.width / 2;
    return {
      innerArc: d3.svg.arc()
        .outerRadius(radius * 0.9)
        .innerRadius(radius * 0.84),
      outerArc: d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius),
      innerRadius: radius * 0.5
    };
  },

  getPosition: function() {
    return "translate(" +
      this.props.width / 2 + "," + this.props.height / 2 + ")";
  },

  getWedges: function () {
    var data = this.internalStorage_get();
    var innerArc = data.innerArc;
    var pie = data.pie;

    return _.map(pie(this.props.data), function (element, i) {
      return (
        <DialSlice
          key={i}
          colorIndex={element.data.colorIndex || i}
          path={innerArc(element)} />
      );
    });
  },

  render: function() {
    return (
      <svg height={this.props.height} width={this.props.width}>
        <g transform={this.getPosition()}>
          <g className="slices">
            {this.getWedges()}
          </g>
          <g text-anchor="middle">
            <text className="h1-jumbo unit">
              {this.props.unit}
            </text>
            <text className="h4 unit-label text-muted" dy="2em">
              {this.props.label}
            </text>
          </g>
        </g>
      </svg>
    );
  }

});

module.exports = DialChart;