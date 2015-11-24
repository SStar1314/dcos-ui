import classNames from "classnames";
import { Link, RouteHandler } from "react-router";
/*eslint-disable no-unused-vars*/
import React from "react";
/*eslint-enable no-unused-vars*/

import Page from "../../components/Page";
import RouteUtil from "../../utils/RouteUtil";
import TabsMixin from "../../mixins/TabsMixin";
import Util from "../../utils/Util";

export default class OrganizationPage extends Util.mixin(TabsMixin) {

  constructor() {
    super();

    this.tabs = {
      "settings-organization-users": "Users",
      "settings-organization-groups": "Groups"
    };

    this.state = {
      currentTab: Object.keys(this.tabs).shift()
    };
  }

  componentWillMount() {
    let routes = this.context.router.getCurrentRoutes();
    let currentRoute = routes[routes.length - 1].name;

    if (Object.keys(this.tabs).indexOf(currentRoute) >= 0) {
      this.setState({currentTab: currentRoute});
    }
  }

  getClassSet(isActive) {
    return classNames({
      "active": isActive
    });
  }

  getLink(tab, isActive) {
    return (
      <li className={this.getClassSet(isActive)}>
        <Link
          key={tab}
          to={tab}
          className="h1 page-header-title inverse flush">
          {this.props.pages[tab]}
        </Link>
      </li>
    );
  }

  getTitle() {
    let routes = this.context.router.getCurrentRoutes();
    let currentRoute = routes[routes.length - 2].name;

    return (
      <ul className="tabs list-inline list-unstyled">
        {RouteUtil.getTabLinks(
          this.props.pages,
          currentRoute,
          this.getLink.bind(this)
        )}
      </ul>
    );
  }

  getNavigation() {
    return (
      <ul className="tabs list-inline flush-bottom inverse">
        {this.tabs_getTabLinks()}
      </ul>
    );
  }

  render() {
    return (
      <Page
        title={this.getTitle()}
        navigation={this.getNavigation()}>
        <RouteHandler />
      </Page>
    );
  }
}

OrganizationPage.contextTypes = {
  router: React.PropTypes.func
};
