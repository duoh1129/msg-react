import Parse from 'parse';
import { addNewChat, deleteChat, updateChat } from 'src/pages/chat/ChatList';

export const liveQueryChatList = async () => {
  let query = new Parse.Query('Conversation');
  query.include('lastMessage');
  let subscription = await query.subscribe();
  subscription.on('create', (newChat) => {
    addNewChat(newChat);
  });
  subscription.on('enter', (newChat) => {
    addNewChat(newChat);
  });
  subscription.on('update', (updatedChat) => {
    updateChat(updatedChat);
  });
  // subscription.on('delete', (deletedChat) => {
  //   deleteChat(deletedChat);
  // });
  subscription.on('leave', (deletedChat) => {
    deleteChat(deletedChat);
  });
};
