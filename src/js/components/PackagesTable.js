import classNames from 'classnames';
import React from 'react';
import {Table} from 'reactjs-components';

import CosmosPackagesStore from '../stores/CosmosPackagesStore';
import PackagesTableHeaderLabels from '../constants/PackagesTableHeaderLabels';
import PackageUpgradeOverview from './PackageUpgradeOverview';
import ResourceTableUtil from '../utils/ResourceTableUtil';
import TableUtil from '../utils/TableUtil';
import UniversePackagesList from '../structs/UniversePackagesList';
import UninstallPackageModal from './modals/UninstallPackageModal';
import UpgradePackageModal from './modals/UpgradePackageModal';

const METHODS_TO_BIND = [
  'getHeadline',
  'getUninstallButton',
  'getUpgradeCell',
  'handleUninstallClick',
  'handleUninstallCancel',
  'handleUninstallFinish',
  'handleUpgradeClick',
  'handlePackageSelection',
  'handleUpgradeCancel'
];

class PackagesTable extends React.Component {
  constructor() {
    super();

    this.state = {
      pendingUpgradeRequest: false,
      packageUninstallError: null,
      pendingUninstallRequest: false,
      pendingUpgradeRequest: false,
      packageToUpgrade: null,
      packageToUninstall: null
    };

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  handleUninstallClick(packageToUninstall) {
    this.setState({packageToUninstall});
  }

  handlePackageSelection(packageToUpgrade) {
    console.log(packageToUpgrade);
    this.setState({packageToUpgrade});
  }

  handleUninstallCancel() {
    this.setState({packageToUninstall: null});
  }

  handleUninstallFinish() {
    CosmosPackagesStore.fetchInstalledPackages();
  }

  handleUpgradeClick(packageToUpgrade) {
    this.setState({packageToUpgrade});
  }

  handleUpgradeCancel() {
    this.setState({packageToUpgrade: null});
  }

  getClassName(prop, sortBy, row) {
    return classNames({
      'highlight': prop === sortBy.prop,
      'clickable': prop === 'appId' && row == null // this is a header
    });
  }

  getColumns() {
    let getClassName = this.getClassName;
    let heading = ResourceTableUtil.renderHeading(PackagesTableHeaderLabels);
    let sortFunction = TableUtil
      .getSortFunction('appId', function (cosmosPackage) {
        return cosmosPackage.getAppId();
      });

    return [
      {
        className: getClassName,
        headerClassName: getClassName,
        heading,
        prop: 'appId',
        render: this.getHeadline,
        sortable: true,
        sortFunction
      },
      {
        className: getClassName,
        headerClassName: getClassName,
        heading,
        prop: 'version',
        render: function (prop, cosmosPackage) {
          return cosmosPackage.getCurrentVersion();
        },
        sortable: false
      },
      {
        className: getClassName,
        headerClassName: getClassName,
        heading: function () {},
        prop: 'uninstall',
        render: this.getUpgradeCell,
        sortable: false
      }
    ];
  }

  getColGroup() {
    return (
      <colgroup>
        <col />
        <col style={{width: '120px'}} />
        <col style={{width: '330px'}} />
      </colgroup>
    );
  }

  getHeadline(prop, cosmosPackage) {
    let packageImages = cosmosPackage.getIcons();
    let name = cosmosPackage.getAppIdName();

    return (
      <div className="package-table-heading flex-box flex-box-align-vertical-center table-cell-flex-box">
        <span className="icon icon-small icon-image-container icon-app-container">
          <img src={packageImages['icon-small']} />
        </span>
        <span className="headline text-overflow">
          {name}
        </span>
      </div>
    );
  }

  getUpgradeCell(prop, cosmosPackage) {
    return (
      <div className="button-collection flush flex-align-right">
        {this.getUninstallButton(cosmosPackage)}
        <PackageUpgradeOverview cosmosPackage={cosmosPackage}
          onAnswerClick={this.handlePackageSelection}
          onUpgradeClick={this.handlePackageSelection}
          onViewProgressClick={this.handlePackageSelection} />
      </div>
    );
  }

  getErrorMessage() {
    let {packageUninstallError} = this.state;
    if (!packageUninstallError) {
      return null;
    }

    let error = CosmosMessages[packageUninstallError.type] ||
      CosmosMessages.default;
    return (
      <p className="text-error-state">
       {error.getMessage(packageUninstallError.name)}
      </p>
    );
  }

  getUninstallButton(cosmosPackage) {
    if (cosmosPackage.isUpgrading()) {
      return null;
    }

    return (
      <a className="button button-link button-danger flush-bottom
        table-display-on-row-hover"
        onClick={this.handleUninstallClick.bind(this, cosmosPackage)}>
        Uninstall
      </a>
    );
  }

  render() {
    let {packageToUpgrade, packageToUninstall} = this.state;

    let isUpgradeModalOpen = !!packageToUpgrade;
    let isUninstallModalOpen = !!packageToUninstall;

    let packageName;
    let packageVersion;

    if (isUpgradeModalOpen) {
      packageName = packageToUpgrade.getName();
      packageVersion = packageToUpgrade.getCurrentVersion();
    }

    return (
      <div>
        <Table
          className="table inverse table-borderless-outer table-borderless-inner-columns flush-bottom"
          columns={this.getColumns()}
          colGroup={this.getColGroup()}
          data={this.props.packages.getItems().slice()}
          sortBy={{prop: 'appId', order: 'desc'}} />
        <UpgradePackageModal
          cosmosPackage={packageToUpgrade}
          onClose={this.handleUpgradeCancel}
          open={isUpgradeModalOpen}
          packageName={packageName}
          packageVersion={packageVersion}
          requireConfirmation={true} />
        <UninstallPackageModal
          cosmosPackage={packageToUninstall}
          handleUninstallFinish={this.handleUninstallFinish}
          onClose={this.handleUninstallCancel}
          open={isUninstallModalOpen} />
      </div>
    );
  }
}

PackagesTable.defaultProps = {
  packages: new UniversePackagesList()
};

PackagesTable.propTypes = {
  packages: React.PropTypes.object.isRequired
};

module.exports = PackagesTable;
