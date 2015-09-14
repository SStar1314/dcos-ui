import classNames from "classnames";
/*eslint-disable no-unused-vars*/
const React = require("react/addons");
/*eslint-enable no-unused-vars*/

import DateUtil from "../utils/DateUtil";
import DetailSidePanel from "./DetailSidePanel";
import MesosSummaryStore from "../stores/MesosSummaryStore";
import MesosStateStore from "../stores/MesosStateStore";
import StringUtil from "../utils/StringUtil";
import TaskView from "./TaskView";

// key is the name, value is the display name
const TABS = {
  tasks: "Tasks",
  details: "Details"
};

export default class NodeSidePanel extends DetailSidePanel {
  constructor() {
    super(...arguments);

    this.state = {
      currentTab: Object.keys(TABS).shift()
    };
  }

  handleTabClick(nextTab) {
    this.setState({currentTab: nextTab});
  }

  getBasicInfo(node) {
    let activeTasksCount = node.sumTaskTypesByState("active");
    let activeTasksSubHeader = StringUtil.pluralize("Task", activeTasksCount);

    return (
      <div>
        <h1 className="inverse flush-top flush-bottom">
          {node.hostname}
        </h1>
        <div>
          {`${activeTasksCount} Active ${activeTasksSubHeader}`}
        </div>
      </div>
    );
  }

  getTabs() {
    let currentTab = this.state.currentTab;

    return Object.keys(TABS).map(function (tab, i) {
      let classSet = classNames({
        "button button-link": true,
        "button-primary": currentTab === tab
      });

      return (
        <div
          key={i}
          className={classSet}
          onClick={this.handleTabClick.bind(this, tab)}>
          {TABS[tab]}
        </div>
      );
    }, this);
  }

  getTaskView() {
    let tasks = MesosStateStore.getTasksFromNodeID(this.props.itemID);

    return (
      <div className="container container-pod flush-top">
        <TaskView tasks={tasks} />
      </div>
    );
  }

  getInfo() {
    let node = MesosStateStore.getNodeFromNodeID(this.props.itemID);

    if (node == null) {
      return null;
    }

    let masterVersion = MesosStateStore.get("lastMesosState").version;
    let registeredValue =
      DateUtil.msToDateStr(node.registered_time.toFixed(3) * 1000);

    let headerValueMapping = {
      ID: node.id,
      Active: StringUtil.capitalize(node.active.toString().toLowerCase()),
      Registered: registeredValue,
      "Master version": masterVersion
    };

    return Object.keys(headerValueMapping).map(function (header, i) {
      return (
        <p key={i} className="row flex-box">
          <span className="column-4 emphasize">
            {header}
          </span>
          <span className="column-12">
            {headerValueMapping[header]}
          </span>
        </p>
      );
    });
  }

  getTabView() {
    let currentTab = this.state.currentTab;

    if (currentTab === "tasks") {
      return this.getTaskView();
    }

    return (
      <div className="container container-pod container-pod-short">
        {this.getInfo()}
      </div>
    );
  }

  getContents() {
    let nodeID = this.props.itemID;
    let last = MesosSummaryStore.get("states").last();
    let node = last.getNodesList().filter({ids: [nodeID]}).last();

    if (node == null) {
      return this.getNotFound("node");
    }

    return (
      <div>
        <div
          className="container container-pod container-pod-divider-bottom
            container-pod-divider-inverse flush-bottom">
          {this.getBasicInfo(node)}
          <div className="side-panel-tabs">
            {this.getTabs()}
          </div>
        </div>
        {this.getTabView()}
      </div>
    );
  }

  render() {
    return super.render(...arguments);
  }
}