/** @jsx React.DOM */

var _ = require("underscore");
var React = require("react");

var ListItem = require("./ListItem");
var TooltipMixin = require("../mixins/TooltipMixin");

var List = React.createClass({

  displayName: "List",

  propTypes: {
    list: React.PropTypes.array.isRequired,
    order: React.PropTypes.array.isRequired
  },

  mixins: [TooltipMixin],

  getListItems: function (list, order) {
    return _.map(list, function (item, key) {
      return (
        <ListItem key={key} data={item} order={order} />
      );
    });
  },

  render: function () {
    return (
      <ul className="list list-unstyled">
        {this.getListItems(this.props.list, this.props.order)}
      </ul>
    );
  }
});

module.exports = List;