import { archiveChatLocal, deArchiveChatLocal } from 'src/pages/chat/ChatList';
import Parse from 'parse';
export const liveQueryChatInfo = async () => {
  let query = new Parse.Query('ConversationInfo');
  query.include('conversation');
  let subscription = await query.subscribe();
  subscription.on('create', (chatInfo) => {
    if (chatInfo?.get('isArchived')) {
      archiveChatLocal(
        chatInfo?.get('conversation')?.id ||
          chatInfo?.get('conversation')?.objectId
      );
    } else {
      deArchiveChatLocal(
        chatInfo?.get('conversation')?.id ||
          chatInfo?.get('conversation')?.objectId
      );
    }
  });
  // subscription.on('enter', (chatInfo) => {
  //   console.log(chatInfo.get('conversation'));
  //   if (chatInfo?.get('isArchived')) {
  //     archiveChatLocal(
  //       chatInfo?.get('conversation')?.id ||
  //         chatInfo?.get('conversation')?.objectId
  //     );
  //   } else {
  //     deArchiveChatLocal(
  //       chatInfo?.get('conversation')?.id ||
  //         chatInfo?.get('conversation')?.objectId
  //     );
  //   }
  // });
  subscription.on('update', (chatInfo) => {
    if (chatInfo?.get('isArchived')) {
      archiveChatLocal(
        chatInfo?.get('conversation')?.id ||
          chatInfo?.get('conversation')?.objectId
      );
    } else {
      deArchiveChatLocal(
        chatInfo?.get('conversation')?.id ||
          chatInfo?.get('conversation')?.objectId
      );
    }
  });
};
