import Parse from 'parse';
import store from 'src/services/redux/store';
export const getOnlineContacts = async () => {
  let query = new Parse.Query('User');
  query.equalTo('isOnline', true);
  query.select('objectId');
  await query.find().then(res => {
    let onlineContacts = [];
    for (const user of res) {
      onlineContacts.push(user.id);
    }
    store.dispatch({
      type: 'setOnlineUsers',
      value: onlineContacts,
    });
  });
};
