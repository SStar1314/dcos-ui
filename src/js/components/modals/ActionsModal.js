import _ from "underscore";
import {Confirm, Dropdown} from "reactjs-components";
import mixin from "reactjs-mixin";
/* eslint-disable no-unused-vars */
import React from "react";
/* eslint-enable no-unused-vars */
import {StoreMixin} from "mesosphere-shared-reactjs";

import ACLGroupStore from "../../stores/ACLGroupStore";
import ACLGroupsStore from "../../stores/ACLGroupsStore";
import StringUtil from "../../utils/StringUtil";
import Util from "../../utils/Util";

const METHODS_TO_BIND = [
  "handleButtonCancel",
  "handleButtonConfirm",
  "handleItemSelection",
  "onGenericError",
  "onGenericSuccess"
];

const DEFAULT_ID = "DEFAULT";
const ITEMS_DISPLAYED = 10;

export default class ActionsModal extends mixin(StoreMixin) {
  constructor() {
    super(...arguments);

    this.state = {
      pendingRequest: false,
      requestErrorCount: null,
      requestsRemaining: null,
      selectedItem: null,
      validationError: null
    };

    this.store_listeners = [
      {
        name: "groups",
        events: ["success", "error"]
      },
      {
        name: "group",
        events: ["addUserError", "addUserSuccess"]
      }
    ];

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(...arguments);

    let diff = _.difference(nextProps.selectedItems, this.props.selectedItems);
    let itemType = nextProps.itemType;

    if (diff.length > 0) {
      if (itemType === "user") {
        ACLGroupsStore.fetchGroups();
      }

      this.setState({
        requestsRemaining: nextProps.selectedItems.length
      });
    }
  }

  componentWillUpdate(nextProps, nextState) {
    super.componentWillUpdate(...arguments);

    if (nextState.requestsRemaining === 0) {
      this.handleButtonCancel();
    }
  }

  componentDidUpdate() {
    super.componentDidUpdate(...arguments);
    let state = this.state;

    // We've accounted for all our errors/successes, no longer pending.
    if ((state.requestErrorCount > 0) &&
    (state.requestsRemaining === state.requestErrorCount)) {
      this.setState({
        pendingRequest: false,
        requestErrorCount: null,
        requestsRemaining: this.props.selectedItems.length
      });
    }
  }

  onGroupStoreAddUserError(groupId, userId, errorMessage) {
    this.onGenericError(errorMessage);
  }

  onGenericError() {
    this.setState({
      requestErrorCount: this.state.requestErrorCount + 1
    });
  }

  onGenericSuccess() {
    this.setState({
      requestsRemaining: this.state.requestsRemaining - 1
    });
  }

  onGroupStoreAddUserSuccess() {
    this.onGenericSuccess();
  }

  getActionsModalContents() {
    let {actionText, itemType, selectedItems} = this.props;
    let selectedItemsString = "";
    // Truncate list of selected user/groups for ease of reading
    let selectedItemsShown = _.first(selectedItems, ITEMS_DISPLAYED + 1);

    // Create a string concatenating n-1 items
    _.chain(selectedItemsShown)
      .initial()
      .pluck("description")
      .each(function (itemDescription) {
        selectedItemsString += `${itemDescription}, `;
      })
      .value();

    // Handle grammar for nth element and concatenate to list
    if (selectedItems.length <= ITEMS_DISPLAYED) {
      selectedItemsString += `and ${_.last(selectedItems).description} `;
    } else if (selectedItems.length === ITEMS_DISPLAYED + 1) {
      selectedItemsString += `and 1 other `;
    } else {
      let overflow = selectedItems.length - ITEMS_DISPLAYED;
      selectedItemsString += `and ${overflow} others `;
    }

    return (
      <div className="container-pod container-pod-short text-align-center">
        <h3 className="flush-top">{actionText.title}</h3>
        <p>{`${selectedItemsString} ${actionText.actionPhrase}.`}</p>
        {this.getDropdown(itemType)}
        {this.getErrorMessage(this.state.validationError)}
      </div>
    );
  }

  getDropdown(itemType) {
    return (
      <div className="container container-pod container-pod-short">
        <Dropdown
          buttonClassName="button dropdown-toggle"
          dropdownMenuClassName="dropdown-menu"
          dropdownMenuListClassName="dropdown-menu-list"
          dropdownMenuListItemClassName="clickable"
          initialID={DEFAULT_ID}
          items={this.getDropdownItems(itemType)}
          onItemSelection={this.handleItemSelection}
          transition={true}
          transitionName="dropdown-menu"
          wrapperClassName="dropdown text-align-left" />
      </div>
    );
  }

  getDropdownItems(itemType) {
    let items = null;
    let itemID = null;
    let dropdownItems = [];
    let defaultItem = {
      html: "",
      id: DEFAULT_ID,
      selectable: false
    };

    if (itemType === "user") {
      items = ACLGroupsStore.get("groups").getItems().sort(
        Util.getLocaleCompareSortFn("description")
      );
      itemID = "gid";
      defaultItem.html = "Choose a group";
    } else if (itemType === "group") {
      // TODO
    }

    dropdownItems = items.map(function (itemInfo) {
      return {
        html: itemInfo.description,
        id: itemInfo[itemID],
        selectedHtml: itemInfo.description
      };
    });

    dropdownItems.unshift(defaultItem);

    return dropdownItems;
  }

  getErrorMessage(error) {
    if (error != null) {
      return (
        <p className="text-error-state">{error}</p>
      );
    }
  }

  getRequestErrorMessage(errors) {
    if (errors.length > 0) {
      let errorMessages = errors.map(function (error, index) {
        return (
          <p className="text-error-state" key={index}>{error}</p>
        );
      });

      return (
        <div>
          {errorMessages}
        </div>
      );
    }
  }

  handleButtonCancel() {
    this.setState({
      pendingRequest: false,
      requestErrorCount: null,
      requestsRemaining: null,
      selectedItem: null,
      validationError: null
    });
    this.props.onClose();
  }

  handleButtonConfirm() {
    let selectedItem = this.state.selectedItem;

    if (selectedItem === null) {
      this.setState({validationError: "Select from dropdown."});
    } else {
      let {action, itemID, itemType, selectedItems} = this.props;
      let itemsByID = _.pluck(selectedItems, itemID);

      if (itemType === "user") {

        if (action === "add") {
          itemsByID.forEach(function (userId) {
            ACLGroupStore.addUser(selectedItem.id, userId);
          });
        } else if (action === "remove") {
          itemsByID.forEach(function (userId) {
            ACLGroupStore.deleteUser(selectedItem.id, userId);
          });
        }

      }

      this.setState({pendingRequest: true});
    }
  }

  handleItemSelection(item) {
    this.setState({
      validationError: null,
      selectedItem: item
    });
  }

  render() {
    let action = this.props.action;
    if (action === null) {
      return null;
    }

    return (
      <Confirm
        disabled={this.state.pendingRequest}
        footerContainerClass="container container-pod container-pod-short
          container-pod-fluid"
        open={!!action}
        onClose={this.handleButtonCancel}
        leftButtonCallback={this.handleButtonCancel}
        rightButtonCallback={this.handleButtonConfirm}
        rightButtonText={StringUtil.capitalize(action)} >
        {this.getActionsModalContents()}
      </Confirm>
    );
  }
}

ActionsModal.defaultProps = {
  action: null,
  actionText: null
};

ActionsModal.propTypes = {
  action: React.PropTypes.string,
  actionText: React.PropTypes.object,
  itemID: React.PropTypes.string.isRequired,
  itemType: React.PropTypes.string.isRequired,
  onClose: React.PropTypes.func.isRequired,
  selectedItems: React.PropTypes.array.isRequired
};
