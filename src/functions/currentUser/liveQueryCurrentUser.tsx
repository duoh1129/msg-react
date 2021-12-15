import Parse from 'parse';
import store from '../../services/redux/store';

export const liveQueryCurrentUser = async () => {
  let queryUser = new Parse.Query('_User').equalTo(
    'objectId',
    Parse.User.current()?.id
  );
  let subscriptionUser = await queryUser.subscribe();
  subscriptionUser.on('update', (updatedContact) => {
    store.dispatch({
      type: 'setUser',
      value: updatedContact,
    });
  });
};
