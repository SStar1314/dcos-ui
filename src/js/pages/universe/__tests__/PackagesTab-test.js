jest.dontMock('../PackagesTab');
jest.dontMock('../../../components/Panel');
jest.dontMock('../../../components/AdvancedConfigModal');
jest.dontMock('../../../components/MultipleForm');
jest.dontMock('../../../stores/CosmosPackagesStore');
jest.dontMock('../../../../../tests/_fixtures/cosmos/packages-search.json');

var JestUtil = require('../../../utils/JestUtil');

JestUtil.unMockStores(['CosmosPackagesStore']);

// Setting useFixtures for when we load StoreMixinConfig
var Config = require('../../../config/Config');
var configUseFixtures = Config.useFixtures;
Config.useFixtures = true;
require('../../../utils/StoreMixinConfig');
Config.useFixtures = configUseFixtures;

var React = require('react');
var ReactDOM = require('react-dom');
var TestUtils = require('react-addons-test-utils');

var CosmosPackagesStore = require('../../../stores/CosmosPackagesStore');
var PackagesTab = require('../PackagesTab');
var UniversePackagesList = require('../../../structs/UniversePackagesList');

describe('PackagesTab', function () {

  beforeEach(function () {
    this.container = document.createElement('div');
    this.instance = ReactDOM.render(<PackagesTab />, this.container);
  });

  afterEach(function () {
    ReactDOM.unmountComponentAtNode(this.container);
  });

  describe('#handleDetailOpen', function () {

    beforeEach(function () {
      this.instance.handleDetailOpen = jasmine.createSpy('handleDetailOpen');
      jest.runAllTimers();
    });

    it('should call handler when panel is clicked', function () {
      var panel = ReactDOM.findDOMNode(this.instance)
        .querySelector('.panel.clickable');
      TestUtils.Simulate.click(panel);

      expect(this.instance.handleDetailOpen.mostRecentCall.args[0].get('name'))
        .toEqual('arangodb');
    });

    it('shouldn\'t call handler when panel button is clicked', function () {
      var panelButton = ReactDOM.findDOMNode(this.instance)
        .querySelector('.panel .button');
      TestUtils.Simulate.click(panelButton);

      expect(this.instance.handleDetailOpen).not.toHaveBeenCalled();
    });

  });

  describe('#handleInstallModalOpen', function () {

    beforeEach(function () {
      this.instance.handleInstallModalOpen =
        jasmine.createSpy('handleInstallModalOpen');
      this.instance.context = {
        router: {
          transitionTo: jasmine.createSpy()
        }
      };
      jest.runAllTimers();
    });

    it('should call handler when panel button is clicked', function () {
      var panelButton = ReactDOM.findDOMNode(this.instance)
        .querySelector('.panel .button');
      TestUtils.Simulate.click(panelButton);
      expect(
        this.instance.handleInstallModalOpen.mostRecentCall.args[0].get('name')
      ).toEqual('arangodb');
    });

    it('shouldn\'t call handler when panel is clicked', function () {
      var panel = ReactDOM.findDOMNode(this.instance)
        .querySelector('.panel.clickable');
      TestUtils.Simulate.click(panel);

      expect(this.instance.handleInstallModalOpen).not.toHaveBeenCalled();
    });

  });

  describe('#getPackages', function () {

    beforeEach(function () {
      this.CosmosPackagesStoreGetAvailablePackages =
        CosmosPackagesStore.getAvailablePackages;
    });

    afterEach(function () {
      CosmosPackagesStore.getAvailablePackages =
        this.CosmosPackagesStoreGetAvailablePackages;
    });

    it('should return packages', function () {
      expect(this.instance.getPackages().length).toEqual(4);
    });

    it('shouldn\'t return packages', function () {
      CosmosPackagesStore.getAvailablePackages = function () {
        return new UniversePackagesList();
      };

      expect(this.instance.getPackages().length).toEqual(0);
    });

  });
});