import Parse from 'parse';
import store from 'src/services/redux/store';
import { updateContact, deleteContact } from '../../pages/contacts/Contacts';

export const liveQueryContacts = async () => {
  let query = new Parse.Query('_User');
  query.notEqualTo('objectId', Parse.User.current()?.id);
  let subscription = await query.subscribe();
  subscription.on('update', (updatedContact) => {
    updateContact(updatedContact);
    if (updatedContact.get('isOnline') == true) {
      store.dispatch({
        type: 'addUserToOnlineList',
        value: updatedContact.id,
      });
    } else {
      store.dispatch({
        type: 'removeUserFromOnlineList',
        value: updatedContact.id,
      });
    }
  });
  subscription.on('delete', (deletedContact) => {
    deleteContact(deletedContact);
  });
};
