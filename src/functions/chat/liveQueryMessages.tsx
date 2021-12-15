import Parse from 'parse';
import store from '../../services/redux/store';
import {
  deleteMessage,
  newChatMessage,
  updateMessage,
} from 'src/pages/chat/Chat';

export const liveQueryMessages = async () => {
  let query = new Parse.Query('Message')
    .include('conversation')
    .include('from');
  let subscription = await query.subscribe();
  subscription.on('create', (newMessage) => {
    let newMessageConvId = newMessage.get('conversation')?.id;
    let currentConvId = store.getState().conversation?.id;
    let fromId = newMessage?.get('from')?.id;

    if (currentConvId == newMessageConvId) {
      //add msg to current chat
      newChatMessage(newMessage);
    } else {
      //show notification
      if (fromId != Parse.User.current()?.id) {
        if (store.getState().replyingToNotification == false) {
          store.dispatch({
            type: 'setNotification',
            value: {
              convId: newMessageConvId,
              convType: newMessage.get('conversation')?.get('type'),
              convTitle:
                newMessage.get('conversation')?.get('type') == 0
                  ? `${newMessage
                      .get('from')
                      .get('firstName')} ${newMessage
                      .get('from')
                      .get('lastName')}`
                  : newMessage.get('conversation')?.get('title'),
              from: `${newMessage
                .get('from')
                .get('firstName')} ${newMessage.get('from').get('lastName')}`,
              messageType: newMessage.get('type'),
              text: newMessage.get('text'),
              time: newMessage.get('createdAt'),
            },
          });
        }
      }
    }
  });
  subscription.on('enter', (newMessage) => {
    let newMessageConvId = newMessage.get('conversation')?.id;
    let currentConvId = store.getState().conversation?.id;
    let fromId = newMessage?.get('from')?.id;

    if (currentConvId == newMessageConvId) {
      //add msg to current chat
      newChatMessage(newMessage);
    } else {
      //show notification
      if (fromId != Parse.User.current()?.id) {
        if (store.getState().replyingToNotification == false) {
          store.dispatch({
            type: 'setNotification',
            value: {
              convId: newMessageConvId,
              convType: newMessage.get('conversation')?.get('type'),
              convTitle:
                newMessage.get('conversation')?.get('type') == 0
                  ? `${newMessage
                      .get('from')
                      .get('firstName')} ${newMessage
                      .get('from')
                      .get('lastName')}`
                  : newMessage.get('conversation')?.get('title'),
              from: `${newMessage
                .get('from')
                .get('firstName')} ${newMessage.get('from').get('lastName')}`,
              messageType: newMessage.get('type'),
              text: newMessage.get('text'),
              time: newMessage.get('createdAt'),
            },
          });
        }
      }
    }
  });

  subscription.on('update', (updatedMessage) => {
    let newMessageConvId = updatedMessage.get('conversation')?.id;
    let currentConvId = store.getState().conversation?.id;
    if (currentConvId == newMessageConvId) {
      //add msg to current chat
      updateMessage(updatedMessage);
    }
  });
  subscription.on('delete', (deletedMessage) => {
    deleteMessage(deletedMessage);
  });
  subscription.on('leave', (deletedMessage) => {
    deleteMessage(deletedMessage);
  });
};
