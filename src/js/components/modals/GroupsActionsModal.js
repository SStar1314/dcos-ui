import _ from 'underscore';
/* eslint-disable no-unused-vars */
import React from 'react';
/* eslint-enable no-unused-vars */

import ActionsModal from './ActionsModal';
import ACLGroupStore from '../../stores/ACLGroupStore';
import ACLUsersStore from '../../stores/ACLUsersStore';
import Util from '../../utils/Util';

export default class GroupsActionsModal extends ActionsModal {
  constructor() {
    super(...arguments);

    this.store_listeners = [
      {
        name: 'groups',
        events: ['success', 'error']
      },
      {
        name: 'group',
        events: ['addUserError', 'addUserSuccess']
      }
    ];

  }

  componentWillMount() {
    super.componentWillMount();

    ACLUsersStore.fetchUsers();
  }

  onGroupStoreAddUserError(groupId, userId, errorMessage) {
    this.onActionError(errorMessage);
  }

  onGroupStoreAddUserSuccess() {
    this.onActionSuccess();
  }

  handleButtonConfirm() {
    let selectedItem = this.state.selectedItem;

    if (selectedItem === null) {
      this.setState({validationError: 'Select from dropdown.'});
    } else {
      let {action, itemID, selectedItems} = this.props;
      let itemsByID = _.pluck(selectedItems, itemID);

      if (action === 'add') {
        itemsByID.forEach(function (groupID) {
          ACLGroupStore.addUser(groupID, selectedItem.id);
        });
      } else if (action === 'remove') {
        itemsByID.forEach(function (groupID) {
          ACLGroupStore.deleteUser(groupID, selectedItem.id);
        });
      }

      this.setState({pendingRequest: true});
    }
  }

  getDropdownItems() {
    let items = ACLUsersStore.get('users').getItems().sort(
      Util.getLocaleCompareSortFn('description')
    );

    let dropdownItems = items.map(function (itemInfo) {
      return {
        html: itemInfo.description,
        id: itemInfo.uid,
        selectedHtml: itemInfo.description
      };
    });

    dropdownItems.unshift({
      html: 'Choose a user',
      id: 'DEFAULT',
      selectable: false
    });

    return dropdownItems;
  }

}

GroupsActionsModal.propTypes = {
  action: React.PropTypes.string.isRequired,
  actionText: React.PropTypes.object.isRequired,
  itemID: React.PropTypes.string.isRequired,
  itemType: React.PropTypes.string.isRequired,
  onClose: React.PropTypes.func.isRequired,
  selectedItems: React.PropTypes.array.isRequired
};