import { attach } from 'ionicons/icons';
import Parse from 'parse';

//@ts-ignore
const messageObj = new Parse.Object.extend('Message');
//@ts-ignore
const attachmentObj = new Parse.Object.extend('Attachment');

export const sendMessage = async (
  currentUserId: string | undefined,
  convId: string,
  message: any,
  messageToReplyTo: any
) => {
  //funzione per mandare il messaggio
  let messageToSend = new messageObj();
  // send only if it has a property
  let attachmentParseName = '';
  if (
    message != undefined &&
    message != '' &&
    (message?.text != undefined ||
      message?.text !== '' ||
      message?.text != null ||
      message?.image != undefined ||
      message?.audio !== undefined ||
      message?.video !== undefined ||
      message?.location !== undefined ||
      message?.contact !== undefined ||
      message?.file !== undefined)
  ) {
    if (message.text !== undefined || message.text != '') {
      messageToSend.set('text', message.text);
      messageToSend.set('type', 0);
    }
    if (message.image != undefined) {
      messageToSend.set('type', 2);
      // upload img in attachment class, then set the pointer
      let attachmentToAdd = new attachmentObj();
      attachmentToAdd.set('file', message.image);
      attachmentToAdd.set('conversation', {
        __type: 'Pointer',
        className: 'Conversation',
        objectId: convId,
      });
      await attachmentToAdd.save().then((attachment: any) => {
        messageToSend.set('attachment', {
          __type: 'Pointer',
          className: 'Attachment',
          objectId: attachment.id,
        });
      });
    } else if (message.audio !== undefined) {
      messageToSend.set('type', 1);
      let attachmentToAdd = new attachmentObj();
      attachmentToAdd.set('audioDuration', message.audioDuration);
      attachmentToAdd.set('file', message.audio);
      attachmentToAdd.set('conversation', {
        __type: 'Pointer',
        className: 'Conversation',
        objectId: convId,
      });
      await attachmentToAdd.save().then((attachment: any) => {
        messageToSend.set('attachment', {
          __type: 'Pointer',
          className: 'Attachment',
          objectId: attachment.id,
        });
      });
    } else if (message.video !== undefined) {
      messageToSend.set('attachment', message.video);
      messageToSend.set('type', 3);
    } else if (message.location !== undefined) {
      messageToSend.set('attachment', message.location);
      messageToSend.set('type', 5);
    } else if (message.contact !== undefined) {
      messageToSend.set('attachment', message.contact);
      messageToSend.set('type', 4);
    } else if (message.file !== undefined) {
      messageToSend.set('type', 6);
      let attachmentToAdd = new attachmentObj();

      attachmentToAdd.set('file', message.file);
      attachmentToAdd.set('conversation', {
        __type: 'Pointer',
        className: 'Conversation',
        objectId: convId,
      });
      await attachmentToAdd.save().then((attachment: any) => {
        messageToSend.set('attachment', {
          __type: 'Pointer',
          className: 'Attachment',
          objectId: attachment.id,
        });
        attachmentParseName = attachment.get('file')._name;
      });
    }

    if (messageToReplyTo != undefined) {
      messageToSend.set('quoted', {
        __type: 'Pointer',
        className: 'Message',
        objectId: messageToReplyTo.id,
      });
    }

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
        return {
        response: true,
        attachmentParseName: attachmentParseName,
      }})
      .catch(() => ({ response: true }));
    return res;
  }
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
