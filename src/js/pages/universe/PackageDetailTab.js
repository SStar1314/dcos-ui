import mixin from 'reactjs-mixin';
/*eslint-disable no-unused-vars*/
import React from 'react';
/*eslint-enable no-unused-vars*/
import {StoreMixin} from 'mesosphere-shared-reactjs';

import CosmosPackagesStore from '../../stores/CosmosPackagesStore';
import ImageViewerModal from '../../components/modals/ImageViewerModal';
import InstallPackageModal from '../../components/modals/InstallPackageModal';
import RequestErrorMsg from '../../components/RequestErrorMsg';
import StringUtil from '../../utils/StringUtil';

const METHODS_TO_BIND = [
  'getMediaItem',
  'handleImageViewerClose',
  'handleInstallModalClose'
];

class PackageDetailTab extends mixin(StoreMixin) {
  constructor() {
    super();

    this.state = {
      hasError: 0,
      openInstallModal: false,
      isLoading: true,
      selectedImage: null
    };

    this.store_listeners = [{
      name: 'cosmosPackages',
      events: ['descriptionError', 'descriptionSuccess'],
      unmountWhen: function (store, event) {
        if (event === 'descriptionSuccess') {
          return !!CosmosPackagesStore.get('packageDetails');
        }
      },
      listenAlways: false
    }];

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  componentDidMount() {
    super.componentDidMount(...arguments);

    let {packageName, packageVersion} = this.props.params;
    // Fetch package description
    CosmosPackagesStore.fetchPackageDescription(packageName, packageVersion);
  }

  onCosmosPackagesStoreDescriptionError() {
    this.setState({hasError: true});
  }

  onCosmosPackagesStoreDescriptionSuccess() {
    this.setState({hasError: false, isLoading: false});
  }

  handleImageViewerClose() {
    this.setState({selectedImage: null});
  }

  handleImageViewerOpen(selectedImage) {
    this.setState({selectedImage});
  }

  handleImageViewerLeftClick(screenshots) {
    let {selectedImage} = this.state;
    if (--selectedImage < 0) {
      selectedImage = screenshots.length - 1;
    }
    this.setState({selectedImage});
  }

  handleImageViewerRightClick(screenshots) {
    let {selectedImage} = this.state;
    // Add before the modulus operator and use modulus as a circular buffer
    this.setState({selectedImage: ++selectedImage % screenshots.length});
  }

  handleInstallModalClose() {
    this.setState({openInstallModal: false});
  }

  handleInstallModalOpen() {
    this.setState({openInstallModal: true});
  }

  getErrorScreen() {
    return <RequestErrorMsg />;
  }

  getItems(definition, renderItem) {
    let items = [];
    definition.forEach((item, index) => {
      let {label, type, value} = item;

      // When there is no content to render, discard it all together
      if (!value || (Array.isArray(value) && !value.length)) {
        return null;
      }

      // If not specific type assume value is renderable
      let content = value;

      // Render sub items
      if (type === 'subItems') {
        content = this.getItems(value, this.getSubItem);
      }

      // Render media items
      if (type === 'media') {
        content = (
          <div className="media-object-spacing-wrapper">
            <div className="media-object flex-box flex-box-wrap" key={index}>
              {this.getItems(value, this.getMediaItem)}
            </div>
          </div>
        );
      }

      items.push(renderItem(label, content, index));
    });

    return items;
  }

  getItem(label, value, key) {
    if (!label || !value) {
      return null;
    }

    if (typeof value === 'string') {
      value = <p className="flush">{value}</p>;
    }

    return (
      <div
        className="container-pod container-pod-short-bottom flush-top"
        key={key}>
        <h5 className="inverse flush-top">{label}</h5>
        {value}
      </div>
    );
  }

  getLoadingScreen() {
    return (
      <div className="container-pod text-align-center vertical-center inverse">
        <div className="row">
          <div className="ball-scale">
            <div />
          </div>
        </div>
      </div>
    );
  }

  getMediaItem(label, value, index) {
    return (
      <div
        className="media-object-item media-object-item-fill"
        key={index}>
        <div
          className="media-object-item-fill-image image-rounded-corners clickable"
          onClick={this.handleImageViewerOpen.bind(this, index)}
          style={{backgroundImage: `url(${value})`}} />
      </div>
    );
  }

  getSubItem(label, value, key) {
    let content = value;

    if (StringUtil.isEmail(value)) {
      content = <a key={key} href={`mailto:${value}`}>{value}</a>;
    }

    if (StringUtil.isUrl(value)) {
      content = <a key={key} href={value}>{value}</a>;
    }

    return (
      <p key={key} className="short">{`${label}: `}{content}</p>
    );
  }

  mapLicenses(licenses) {
    licenses = licenses || [];
    return licenses.map(function (license) {
      let item = {
        label: license.name,
        value: license.url
      };

      return item;
    });
  }

  mapScreenshots(screenshots) {
    screenshots = screenshots || [];
    return screenshots.map(function (screenshot) {
      return {value: screenshot};
    });
  }

  render() {
    let {props, state} = this;

    if (state.hasError || !props.params.packageName) {
      return this.getErrorScreen();
    }

    let cosmosPackage = CosmosPackagesStore.getPackageDetails();
    if (state.isLoading || !cosmosPackage) {
      return this.getLoadingScreen();
    }

    let screenshots = cosmosPackage.getScreenshots();

    let packageDetails = cosmosPackage.get('package');
    let definition = [
      {
        label: 'Description',
        value: <div dangerouslySetInnerHTML={StringUtil.parseMarkdown(packageDetails.description)} />
      },
      {
        label: 'Pre-Install Notes',
        value: <div dangerouslySetInnerHTML={StringUtil.parseMarkdown(packageDetails.preInstallNotes)} />
      },
      {
        label: 'Information',
        type: 'subItems',
        value: [
          {label: 'SCM', value: packageDetails.scm},
          {label: 'Maintainer', value: packageDetails.maintainer}
        ]
      },
      {
        label: 'Licenses',
        type: 'subItems',
        value: this.mapLicenses(packageDetails.licenses)
      },
      {
        label: 'Media',
        type: 'media',
        value: this.mapScreenshots(screenshots)
      }
    ];

    let {selectedImage} = this.state;
    return (
      <div>
        <div className="container-pod container-pod-short-bottom container-pod-divider-bottom container-pod-divider-inverse flush-top">
          <div className="media-object-spacing-wrapper">
            <div className="media-object media-object-align-middle">
              <div className="media-object-item">
                <div className="icon icon-huge icon-image-container icon-app-container">
                  <img src={cosmosPackage.getIcons()['icon-large']} />
                </div>
              </div>
              <div className="media-object-item">
                <h1 className="inverse flush">
                  {packageDetails.name}
                </h1>
                <p>{packageDetails.version}</p>
                <button
                  className="button button-success"
                  onClick={this.handleInstallModalOpen.bind(this, cosmosPackage)}>
                  Install Package
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="container-pod container-pod-short">
          {this.getItems(definition, this.getItem)}
        </div>
        <InstallPackageModal
          open={state.openInstallModal}
          packageName={packageDetails.name}
          packageVersion={packageDetails.version}
          onClose={this.handleInstallModalClose}/>
        <ImageViewerModal
          onLeftClick={this.handleImageViewerLeftClick.bind(this, screenshots)}
          onRightClick={this.handleImageViewerRightClick.bind(this, screenshots)}
          images={screenshots}
          open={selectedImage != null}
          onClose={this.handleImageViewerClose}
          selectedImage={selectedImage} />
      </div>
    );
  }
}

module.exports = PackageDetailTab;
