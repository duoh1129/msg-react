import Parse from 'parse';

//@ts-ignore
const messageObj = new Parse.Object.extend('Message');

export const sendSecretMessage = async (
  currentUserId: string | undefined,
  convId: string,
  message: string
) => {
  //funzione per mandare il messaggio
  let messageToSend = new messageObj();

  messageToSend.set('text', message);
  messageToSend.set('type', 0);

  messageToSend.set('from', {
    __type: 'Pointer',
    className: '_User',
    objectId: currentUserId,
  });
  messageToSend.set('conversation', {
    __type: 'Pointer',
    className: 'Conversation',
    objectId: convId,
  });
  //aggiorna il lastmessage della conversation e crea il messaggio
  let res = await messageToSend
    .save()
    .then(() => {
      deArchiveChat(convId);
      return {response: true,}
    })
    .catch(() => ({ response: true }));
  return res;
};

const deArchiveChat = async (chatId: string) => {
  let queryChatInfo = new Parse.Query('ConversationInfo')
    .equalTo('user', {
      __type: 'Pointer',
      className: '_User',
      objectId: Parse.User.current()?.id,
    })
    .equalTo('conversation', {
      __type: 'Pointer',
      className: 'Conversation',
      objectId: chatId,
    });
  await queryChatInfo.first().then(async (conversationInfo) => {
    if(conversationInfo?.get('isArchived')){
      conversationInfo?.set('isArchived', false);
    await conversationInfo
      ?.save()
      .catch((err) => console.error(JSON.stringify(err)));
    }
  });
};