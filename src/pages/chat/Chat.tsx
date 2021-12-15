import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import Parse from 'parse';
import { App } from '@capacitor/app';
import E2E from 'e2e-encryption';

import {Toast} from '@ionic-native/toast';

import {
  IonContent,
  IonPage,
  IonFooter,
  IonButtons,
  IonButton,
  IonIcon,
  IonTextarea,
  IonRefresher,
  IonRefresherContent,
  IonDatetime,
} from '@ionic/react';
import {
  addOutline,
  send,
  chevronDownCircleOutline,
  closeOutline,
} from 'ionicons/icons';

import store from '../../services/redux/store';
import 'src/assets/sass/messagenius/pages/chat/Chat.scss';
import ChatHeader from 'src/components/Header/ChatHeader';

import { getMessageDate } from 'src/functions/chat/getMessageDate';
import { sendMessage } from 'src/functions/chat/sendMessage';

import NotificationPopUp from 'src/components/notification/NotificationPopUp';
import { connect } from 'react-redux';
import VoiceRecorder from 'src/components/chat/voiceRecorder/VoiceRecorder';
import TextMessage from 'src/components/chat/message/TextMessage';
import ImageMessage from 'src/components/chat/message/ImageMessage';
import VoiceMessage from 'src/components/chat/message/VoiceMessage';
import AddAttachment from 'src/components/chat/addAttachment/AddAttachment';
import ShowPicture from 'src/components/chat/showPicture/ShowPicture';
import FileMessage from 'src/components/chat/message/FileMessage';
import SystemMessage from 'src/components/chat/message/SystemMessage';
import MessageInfo from './MessageInfo';
import { useLocalStorage } from 'src/functions/chat/hooks/useLocalStorage';
import { computeHeadingLevel } from '@testing-library/react';
import MessageToReplyTo from 'src/components/chat/messageToReplyTo/MessageToReplyTo';
import { sendSecretMessage } from 'src/functions/chat/sendSecretMessage';
import LinkPreview from 'src/components/chat/message/linkPreview/LinkPreview';
import ForwardMessages from './ForwardMessages';
import ScheduledMessagesList from './ScheduledMessagesList';

//handle new message
export const newChatMessage = async (msg: any) => {
  //if its a msg with an attachment, get the attachment
  if ([1, 2, 3, 6].includes(msg.get('type'))) {
    await new Parse.Query('Attachment')
      .equalTo('objectId', msg.get('attachment').id)
      .first()
      .then((res: any) => {
        msg.set('attachment', res);
      });
  }
  //@ts-ignore
  Chat.addNewMessage(msg);
};

export const updateMessage = async (msg: any) => {
  //if its an img msg get the attachment
  if (msg.get('type') == 2) {
    await new Parse.Query('Attachment')
      .equalTo('objectId', msg.get('attachment').id)
      .first()
      .then((res: any) => {
        msg.set('attachment', res);
      });
  }
  //@ts-ignore
  Chat.updateMessage(msg);
};

export const deleteMessage = async (msg: any) => {
  //@ts-ignore
  if (Chat.deleteMessage) {
    //@ts-ignore
    Chat.deleteMessage(msg);
  }
};

//livequery conversation
const lqConv = async (convId: string) => {
  let query = new Parse.Query('Conversation');
  query.equalTo('objectId', convId).include('participants').include('admins');
  let sub = await query.subscribe();
  sub.on('update', (conv) => {
    //@ts-ignore
    Chat.updateConv(conv);
  });
  sub.on('delete', () => {
    //@ts-ignore
    Chat.deleteConv();
  });
  const unsub = () => {
    sub.unsubscribe();
  };
  //@ts-ignore
  lqConv.unsub = unsub;
};

interface RProps {
  notification: any;
}

const Chat: React.FC<RProps> = ({ notification }) => {
  //@ts-expect-error
  const convId = useParams().conversationId; //get conversation id
  let history = useHistory(); //history

  //variables-constants
  const pastMessagesPerQuery = 50;
  const messagesFirstQueryNumber = 50;

  //refs
  const messagesEndRef = useRef(null); //to scroll to bottom
  const messagesContainerRef = useRef(null); //to stay where we are on messages

  let msgDate: any;
  let prevMsgDate: any; //needed to show the date tooltip
  let showTooltip: boolean = false; //showToolTip only if it has a different date from the prev
  let isLastMessage: boolean = false; //showToolTip if it is the last message
  let showTwoTooltips = false; //if there is only one message with the date show two tooltips

  // custom hooks
  const [messagesLocalStorage, setMessagesLocalStorage] = useLocalStorage(
    `_cached_messages_${convId}`,
    ''
  );

  //useStates

  //conversation obj
  const [conv, setConv] = useState<Parse.Attributes>();
  //is chat single
  const [isSingle, setIsSingle] = useState<boolean>();
  //messages list
  const [messages, setMessages] = useState<Parse.Object<Parse.Attributes>[]>(
    []
  );
  //show download more messages button
  const [showDownloadButton, setShowDownloadButton] = useState<boolean>();
  ///if the button is pressed disable the useEffect used to scroll to bottom
  const [downloadedMore, setDownloadedMore] = useState<boolean>(false);
  //message to send
  const [message, setMessage] = useState<any>({
    text: undefined,
    image: undefined,
    audio: undefined,
    video: undefined,
    location: undefined,
    contact: undefined,
    file: undefined,
  });
  // selected messages array
  const [selectedMessages, setSelectedMessages] = useState<
    Parse.Object<Parse.Attributes>[]
  >([]);
  // editing message
  const [editingMessage, setEditingMessage] = useState<any>({
    message: undefined,
    newText: undefined,
  });
  // show message info
  const [showMessageInfo, setShowMessageInfo] = useState<
    Parse.Object<Parse.Attributes> | undefined
  >(undefined);
  // to show the "delete for everyone"
  const [areAllSelectedMessagesFromMe, setAreAllSelectedMessagesFromMe] =
    useState(false);
  // show delete for me / everyone
  const [showDeleteMessagesMenu, setShowDeleteMessagesMenu] = useState(false);
  //picture to show when user clicks on a message or selects pic from gallery
  const [pictureToShow, setPictureToShow] = useState<any>({
    imageUrl: undefined,
    name: undefined,
    date: undefined,
  });
  // show attachment menu (camera, gallery.....)
  const [showAddAttachment, setShowAddAttachment] = useState<boolean>(false);
  //show a picture on full screen
  const [showPicture, setShowPicture] = useState<boolean>(false);

  // scheduled message menu and info
  const [showScheduledMessageMenu, setShowScheduledMessageMenu] = useState<boolean>(false);
  const [scheduledMessage, setScheduledMessage] = useState<string>('');
  const [scheduledMessageDate, setScheduledMessageDate] = useState<any | undefined>(undefined);
  
  // scheduled message list page
  const [showScheduledMessagesList, setShowScheduledMessagesList] = useState<boolean>(false);

  // picture chosen from gallery
  const [chosenPicture, setChosenPicture] = useState<File | undefined>(
    undefined
  );
  // show send picture button
  const [showSendPictureButton, setShowSendPictureButton] =
    useState<boolean>(false);

  //if the app is not active place all the message IDs in an array and when the app is resumed show the read marks
  const [messagesWhileInBackground, setMessagesWhileInBackground] = useState<
    string[]
  >([]);
  // is app active or in background
  const [isAppActive, setIsAppActive] = useState<boolean>(true);

  const [replyingToMessage, setReplyingToMessage] = useState<any>(undefined);
  const [messageIncludesLink, setMessageIncludesLink] = useState<
    string | undefined
  >(undefined);

  const [showForwardMessagesPage, setShowForwardMessagesPage] =
    useState<boolean>(false);

  //useEffects

  //set messages to [] every time convId changes
  useEffect(() => {
    setMessages([]);
    setMessage(undefined);
  }, []);

  //set conversation
  useEffect(() => {
    if (convId == undefined) {
      history.replace('/tabs/chat/list');
    }

    const setConversationToCachedConversation = () => {
      let otherParticipant: any;
      // set the conversation's title with the cached conversations
      let cachedChats =
        JSON.parse(localStorage.getItem('_cached_conversation_list') || '') ||
        [];
      let chat = cachedChats.find((chat: any) => chat?.objectId === convId);

      let chatObj = Parse.Object.fromJSON({
        ...chat,
        className: 'Conversation',
      });

      if (chatObj.get('type') !== 1) {
        // get the participant's id

        if (chatObj?.get('participants')?.find) {
          otherParticipant = chatObj
            ?.get('participants')
            ?.find(
              (user: any) =>
                (user.id || user?.objectId) != Parse.User.current()?.id
            );
        }

        // if the other participant is defined in the object then set the title with it, otherwise find the participant object among the cached contacts list
        if (
          otherParticipant?.get('firstName') != undefined &&
          otherParticipant?.get('lastName') != undefined
        ) {
          chatObj.set(
            'title',
            `${otherParticipant?.get('firstName')} ${otherParticipant?.get(
              'lastName'
            )}`
          );
        } else {
          // find the user
          let users = JSON.parse(
            localStorage.getItem('_cached_contacts_list') || ''
          );
          let otherParticipantObjFromUsers = [...users].find(
            (user: any) => user?.objectId == otherParticipant?.id
          );
          // create the parse object
          let participant = Parse.Object.fromJSON({
            ...otherParticipantObjFromUsers,
            className: '_User',
          });
          // set the title
          chatObj.set(
            'title',
            `${participant.get('firstName')} ${participant.get('lastName')}`
          );
        }
        setConv(chatObj?.attributes);
        store.dispatch({
          type: 'setConversation',
          value: chatObj,
        });
      } else {
        setConv(chatObj?.attributes);
        store.dispatch({
          type: 'setConversation',
          value: chatObj,
        });
      }
    };

    setConversationToCachedConversation();

    const query = new Parse.Query('Conversation'); // query conversation
    query
      .equalTo('objectId', convId)
      .includeAll()
      .first()
      .then(async (res) => {
        // common conversation stuff
        setIsSingle(res?.get('type') == 0 ? true : false);
        if (res?.get('type') == 0) {
          //if it is single
          //if participants is not an array of users
          if (res.get('participants').length == undefined) {
            await res
              ?.get('participants')
              .query()
              .notEqualTo('objectId', Parse.User.current()?.id)
              .include('avatar')
              .first()
              .then((user: Parse.Object<Parse.Attributes>) => {
                //set title and avatar as other participant's name, check if he is online and if he is add him to the onlineList.
                res.set(
                  'title',
                  `${user.get('firstName')} ${user.get('lastName')}`
                );
                res.set('avatar', user.get('avatar')?.get('thumb'));
                res.set('participants', [Parse.User.current(), user]);
              });
          } else {
            //if participants is an array of users
            let otherUser = res
              .get('participants')
              .find((user: any) => user.id != Parse.User.current()?.id);
            res.set(
              'title',
              `${otherUser.get('firstName')} ${otherUser.get('lastName')}`
            );
            res.set('avatar', otherUser.get('avatar')?.get('thumb'));
            res.set('participants', [Parse.User.current(), otherUser]);
          }
          //if admins is not an array of users
          if (res.get('admins').length == undefined) {
            await res
              ?.get('admins')
              .query()
              .find()
              .then((admins: any) => {
                res.set('admins', admins);
              });
          }
        } else {
          //if participants is not an array of users
          if (res?.get('participants').length == undefined) {
            await res
              ?.get('participants')
              .query()
              .find()
              .then((participants: any) => {
                res.set('participants', participants);
              });
          }
          //if admins is not an array of users
          if (res?.get('admins').length == undefined) {
            await res
              ?.get('admins')
              .query()
              .find()
              .then((admins: any) => {
                res.set('admins', admins);
              });
          }
        }

        // secret conversation stuff
        //if the user doesn't have keys for this conversation (is new) create them
        if (
          res?.get('publicKeys') &&
          Object.keys(res?.get('publicKeys')).length == 1 &&
          !Object.keys(res?.get('publicKeys')).includes(
            //@ts-expect-error
            Parse.User.current()?.id
          )
        ) {
          let myKeys = new E2E('', '', { useSameKeyPerClient: false });
          // add public key to parse
          let publicKeys = {
            ...res?.get('publicKeys'),
            [`${Parse.User.current()?.id}`]: myKeys.publicKey,
          };
          // save to the localStorage
          localStorage.setItem(
            `_cached_keys_${res?.id}`,
            JSON.stringify({
              myPublicKey: myKeys.publicKey,
              myPrivateKey: myKeys.privateKey,
            })
          );
          // run parse function to save public keys to the cloud
          await Parse.Cloud.run('setPublicKeys', {
            publicKeys: publicKeys,
            convId: convId,
          });
        }
        // if there are public keys (the conversation is secret)
        if (res?.get('publicKeys')) {
          let myKeys;
          try {
            myKeys = await JSON.parse(
              localStorage.getItem(`_cached_keys_${convId}`) || ''
            );
          } catch (err) {
            console.log(err);
          }
          if (myKeys?.myPublicKey == undefined) {
            // remove the conversation for me
            await Parse.Cloud.run('deleteConversationForMe', {
              convId: convId,
            });
            // key mismatch > close the conversation
            await Parse.Cloud.run('publicKeysNotMatching', { convId: convId });
            history.replace('/tabs/chat/list');
            // show the alert
            alert(
              'Your decryption key is corrupted, the conversation is not available.'
            );
          }
        }

        setConv(res?.attributes);
        store.dispatch({
          type: 'setConversation',
          value: res,
        });
      });

    return () => {
      store.dispatch({
        type: 'setConversation',
        value: {},
      });
    };
    //@ts-ignore
  }, [useParams().conversationId]);

  //query messages
  useEffect(() => {
    const getMessages = async () => {
      // setup query
      const querymessages = new Parse.Query('Message');
      querymessages.equalTo('conversation', {
        __type: 'Pointer',
        className: 'Conversation',
        objectId: convId,
      });
      querymessages.include('from');
      querymessages.include('attachment');

      // get messages from localStorage
      let keyName = `_cached_messages_${convId}`;

      let cachedMessages: any = [];
      if (localStorage.getItem(keyName) != null) {
        // @ts-expect-error
        cachedMessages = JSON.parse(localStorage.getItem(keyName));
      }

      // if localStorage messages are more than 0 get the new messages, otherwise get the first x messages
      if (cachedMessages.length > 0) {
        // set messages
        let cachedMessagesParseObj = [...cachedMessages].map((message: any) =>
          Parse.Object.fromJSON({ ...message, className: 'Message' })
        );
        // query setup
        querymessages.greaterThan(
          'createdAt',
          cachedMessagesParseObj[0]?.get('createdAt')
        );
        querymessages.descending('createdAt');
        let newMessages = await querymessages.find();
        // add the new messages to an array
        let allMessages = [...newMessages, ...cachedMessagesParseObj];

        // write to the localStorage
        //@ts-expect-error
        setMessagesLocalStorage(JSON.stringify(allMessages));
        checkIfMessagesWereUpdated(
          [...cachedMessages].map((message: any) =>
            Parse.Object.fromJSON({ ...message, className: 'Message' })
          )
        );
        checkIfMessagesWereDeleted(
          [...cachedMessages].map((message: any) =>
            Parse.Object.fromJSON({ ...message, className: 'Message' })
          )
        );
        for (const msg of allMessages) {
          if (msg.get('from').id != Parse.User.current()?.id) {
            Parse.Cloud.run('setReadMessageInfo', {
              messageID: msg.id,
            });
          }
        }
      } else {
        // query setup
        querymessages.limit(messagesFirstQueryNumber);
        querymessages.descending('createdAt');
        let messages = await querymessages.find();

        // write to the localStorage
        //@ts-expect-error
        setMessagesLocalStorage(JSON.stringify(messages));
        for (const msg of messages) {
          if (msg?.get('from')?.id != Parse.User.current()?.id) {
            Parse.Cloud.run('setReadMessageInfo', {
              messageID: msg?.id,
            });
          }
        }
      }

      return true;
    };
    getMessages();

    // to call the function outside the useEffect (when refreshing)
    //@ts-expect-error
    useEffect.getMessages = getMessages;
    //@ts-ignore
  }, [useParams().conversationId]);

  // listen for message updates in the localStorage and show them
  useEffect(() => {
    let keyName = `_cached_messages_${convId}`;
    let messagesObj: any = [];
    // need to put it in a try/catch otherwise it will freeze the app
    try {
      messagesObj = JSON.parse(localStorage.getItem(keyName) || '');
    } catch (err) {}
    let messagesParseObj = messagesObj.map((message: any) =>
      Parse.Object.fromJSON({ ...message, className: 'Message' })
    );
    // decrypt messages if the conversation is secret
    if (conv?.isSecret) {
      // get my keys
      let myKeys;
      try {
        myKeys = JSON.parse(
          localStorage.getItem(`_cached_keys_${convId}`) || ''
        );
      } catch (err) {}
      // encryption instance
      let encryption = new E2E(myKeys?.myPublicKey, myKeys?.myPrivateKey, {
        useSameKeyPerClient: false,
      });
      // get other user pub key
      let otherUserPublicKey =
        conv?.publicKeys[
          `${Object.keys(conv?.publicKeys).find(
            (key) => key != Parse.User.current()?.id
          )}`
        ];
      let messages = [...messagesParseObj];
      // decrypt the messages
      for (let msg of messages) {
        let msgDecrypted;
        // put it in a try catch because otherwise it will throw an error when trying to decrypt already decrypted messages
        try {
          msgDecrypted = encryption.Decrypt(
            msg.get('text'),
            otherUserPublicKey,
            {
              useSameKeyPerClient: false,
            }
          );
        } catch (err) {}
        //@ts-expect-error
        if (msgDecrypted) msg.set('text', msgDecrypted?.text); // change the text with the decrypted one
      }
      setMessages(messages);
    } else {
      // set messages
      setMessages(messagesParseObj);
    }
  }, [messagesLocalStorage]);

  //start-stop liveQuery
  useEffect(() => {
    lqConv(convId);
    return () => {
      //@ts-ignore
      if (lqConv.unsub) {
        //@ts-ignore
        lqConv.unsub();
      }
    };
    //@ts-ignore
  }, [useParams().conversationId]);

  // if there are messages before the last message, show the download more button
  useEffect(() => {
    // check the first time and then when you query past messages or refresh the chat
    const checkMessagesBeforeTheLast = async () => {
      let keyName = `_cached_messages_${convId}`;
      let messagesObj: any = [];
      // need to put it in a try/catch otherwise it will freeze the app
      try {
        messagesObj = JSON.parse(localStorage.getItem(keyName) || '');
      } catch (err) {}

      let lastMessageObj = messagesObj[messagesObj.length - 1];
      let lastMessageParseObj = Parse.Object.fromJSON({
        ...lastMessageObj,
        className: 'Message',
      });
      let lastMessagesQuery = new Parse.Query('Message')
        .equalTo('conversation', {
          __type: 'Pointer',
          className: 'Conversation',
          objectId: convId,
        })
        .lessThan('createdAt', lastMessageParseObj.get('createdAt'));
      let oldMessages = await lastMessagesQuery
        .count()
        .catch((err) => console.log('Error counting oldMessages: ', err));
      oldMessages > 0
        ? setShowDownloadButton(true)
        : setShowDownloadButton(false);
    };
    checkMessagesBeforeTheLast();

    //@ts-expect-error
    useEffect.checkMessagesBeforeTheLast = checkMessagesBeforeTheLast;

    //@ts-ignore
  }, [useParams().conversationId]);

  //if message is undefined scroll to chat bottom
  useEffect(() => {
    if (
      (message?.text == '' || message == undefined) &&
      !downloadedMore &&
      selectedMessages.length == 0
    )
      scrollToBottom();
  });

  // check if all selected messages are from me
  useEffect(() => {
    //prettier-ignore
    let isAMessageNotFromMe = [...selectedMessages].findIndex(msg => msg.get('from').id != Parse.User.current()?.id) == -1 ? false : true;
    setAreAllSelectedMessagesFromMe(isAMessageNotFromMe ? false : true);
  }, [selectedMessages]);

  // is app active listeners
  useEffect(() => {
    App.addListener('appStateChange', ({ isActive }) => {
      setIsAppActive(isActive);
    });
    return () => {
      App.removeAllListeners();
    };
    //@ts-expect-error
  }, [useParams().conversationId]);

  // when the app is resumed set read to all the messages in the chat if there are any
  useEffect(() => {
    const setReadMessageInfoAfterResumingApp = async () => {
      for await (const id of messagesWhileInBackground) {
        if (
          messages?.find((msg) => msg?.id == id)?.get('from')?.id !=
          Parse.User.current()?.id
        ) {
          Parse.Cloud.run('setReadMessageInfo', {
            messageID: id,
          }).then(() => {
            setMessagesWhileInBackground([]);
          });
        }
      }
    };
    if (isAppActive && messagesWhileInBackground.length > 0) {
      setReadMessageInfoAfterResumingApp();
    }
  }, [isAppActive]);

  //Functions

  //livequery events
  const addNewMessage = (msg: any) => {
    let allMessages = [msg, ...messages];
    //@ts-expect-error
    setMessagesLocalStorage(JSON.stringify(allMessages));

    // if its active set read otherwise add the id to the messageswhileinbackground
    if (isAppActive) {
      if (
        (msg.get('from')?.id ?? msg.get('from')?.objectId) !=
        Parse.User.current()?.id
      ) {
        Parse.Cloud.run('setReadMessageInfo', {
          messageID: msg.id,
        });
      }
    } else {
      setMessagesWhileInBackground((messagesWhileInBackground) => [
        ...messagesWhileInBackground,
        msg.id,
      ]);
    }
  };
  //@ts-ignore
  Chat.addNewMessage = addNewMessage;

  //livequery events
  const updateMessage = (msg: any) => {
    let messagesArray = [...messages];
    let msgIndex = messagesArray.findIndex(
      (message: any) => message.id == msg.id
    );
    messagesArray[msgIndex] = msg;
    // @ts-expect-error
    setMessagesLocalStorage(JSON.stringify(messagesArray));
  };
  //@ts-ignore
  Chat.updateMessage = updateMessage;

  const deleteMessage = (msg: any) => {
    let keyName = `_cached_messages_${convId}`;

    let cachedMessages: any = [];
    if (localStorage.getItem(keyName) != null) {
      // @ts-expect-error
      cachedMessages = JSON.parse(localStorage.getItem(keyName));
    }
    let messagesParseObj = cachedMessages.map((message: any) =>
      Parse.Object.fromJSON({ ...message, className: 'Message' })
    );

    let messagesArray = [...messagesParseObj];
    let msgIndex = messagesArray.findIndex(
      (message: any) => message.id == msg.id
    );
    let deleted = messagesArray.splice(msgIndex, 1);
    //@ts-expect-error
    setMessagesLocalStorage(JSON.stringify(messagesArray));
  };
  //@ts-ignore
  Chat.deleteMessage = deleteMessage;

  const updateConv = (conv: any) => {
    setConv(conv.attributes);
  };
  //@ts-ignore
  Chat.updateConv = updateConv;
  const deleteConv = () => {
    history.replace('/tabs/chat/list');
  };
  //@ts-ignore
  Chat.deleteConv = deleteConv;

  //query past messages (when going up the conversation)
  const queryPast = async () => {
    setDownloadedMore(true);
    //@ts-expect-error
    messagesContainerRef.current.scrollToPoint(0, 1); //scroll one pixel down to stay where we are on the messages

    let keyName = `_cached_messages_${convId}`;
    let messagesObj: any = [];
    // need to put it in a try/catch otherwise it will freeze the app
    try {
      messagesObj = JSON.parse(localStorage.getItem(keyName) || '');
    } catch (err) {}

    let cachedMessagesParseObj = await messagesObj.map((message: any) =>
      Parse.Object.fromJSON({ ...message, className: 'Message' })
    );

    let lastMessageParseObj =
      cachedMessagesParseObj[cachedMessagesParseObj.length - 1];

    let lastMessagesQuery = new Parse.Query('Message')
      .equalTo('conversation', {
        __type: 'Pointer',
        className: 'Conversation',
        objectId: convId,
      })
      .lessThan('createdAt', lastMessageParseObj.get('createdAt'))
      .descending('createdAt')
      .limit(pastMessagesPerQuery);
    let oldMessages = await lastMessagesQuery.find();
    // add the new messages to the localStorage
    let allMessages = [...cachedMessagesParseObj, ...oldMessages];

    //@ts-expect-error
    setMessagesLocalStorage(JSON.stringify(allMessages));

    //@ts-expect-error
    useEffect.checkMessagesBeforeTheLast();
  };

  //show link preview on message
  useEffect(() => {
    let url = message?.text?.match(
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
    );
    if (url != null) {
      setMessageIncludesLink(url);
    } else {
      setMessageIncludesLink(undefined);
    }
  }, [message?.text]);

  const refreshMessages = async (e: CustomEvent) => {
    let keyName = `_cached_messages_${convId}`;
    localStorage.removeItem(keyName);
    //@ts-ignore
    await useEffect.getMessages().then(() => {
      e.detail.complete();
      scrollToBottom();
      //@ts-expect-error
      useEffect.checkMessagesBeforeTheLast();
    });
  };

  const checkIfMessagesWereUpdated = async (
    messagesParseObj: Parse.Object<Parse.Attributes>[]
  ) => {
    let firstMessageDate = messagesParseObj[0]?.get('createdAt');
    let lastMessageDate =
      messagesParseObj[messagesParseObj.length - 1]?.get('createdAt');

    // get the most recent updated message on localStorage (which is basically the last time we updated the messages),
    // then query all the messages with updatedAt after the most recent in the localStorage and substitute them

    let mostRecentUpdatedAt = Math.max(
      ...[...messagesParseObj].map((msg: Parse.Object<Parse.Attributes>) =>
        parseInt(msg.get('updatedAt').getTime())
      )
    );

    let queryMessagesUpdated = new Parse.Query('Message')
      .equalTo('conversation', {
        __type: 'Pointer',
        className: 'Conversation',
        objectId: convId,
      })
      .greaterThanOrEqualTo('createdAt', lastMessageDate)
      .lessThanOrEqualTo('createdAt', firstMessageDate)
      .greaterThan('updatedAt', new Date(mostRecentUpdatedAt));
    let messagesUpdated = await queryMessagesUpdated.find();

    if (messagesUpdated.length > 0) {
      // if there are updated messages, substitute them with the old ones and save them to the setMessagesLocalStorage
      let messages = [...messagesParseObj];
      for await (let newMsg of messagesUpdated) {
        let index = messages.findIndex((msg) => msg.id == newMsg.id);
        messages[index] = newMsg;
      }

      // write changes to the localStorage
      //@ts-expect-error
      setMessagesLocalStorage(JSON.stringify(messages));
    }
  };

  // we save the last conv update date we got, so that we only query for message infos past that date
  const checkIfMessagesWereDeleted = async (
    messagesParseObj: Parse.Object<Parse.Attributes>[]
  ) => {
    // get last conversation update
    let lastMessageInfoUpdate;
    try {
      lastMessageInfoUpdate = parseInt(
        localStorage.getItem(`_cached_lastConversationUpdate_${convId}`) || '0'
      );
    } catch (err) {}
    // get message infos
    let queryDeletedMessageInfos = new Parse.Query('MessageInfo')
      .equalTo('conversation', convId)
      .exists('deletedAt');
    if ((lastMessageInfoUpdate || 0) > 0) {
      queryDeletedMessageInfos.greaterThan(
        'deletedAt',
        new Date(lastMessageInfoUpdate || 0)
      );
    }
    // get the most recent date
    let messageInfos = await queryDeletedMessageInfos.find();
    // set last conv update date
    if (messageInfos.length > 0) {
      let mostRecentMessageInfo = Math.max(
        ...messageInfos?.map((msg) => msg.get('updatedAt').getTime())
      );
      localStorage.setItem(
        `_cached_lastConversationUpdate_${convId}`,
        `${mostRecentMessageInfo || 0}`
      );
    }

    let messages = [...messagesParseObj];
    for (let messageInfo of messageInfos) {
      // find the message and remove it
      let msgIndex = messages.findIndex(
        (msg) => msg.id == messageInfo.get('message').id
      );
      let deleted = messages.splice(msgIndex, 1);
    }

    // write changes to the localStorage
    //@ts-expect-error
    setMessagesLocalStorage(JSON.stringify(messages));
  };

  //send a message
  const handleSendMessage = async (
    e: any,
    currentUserId: string | undefined,
    convId: string
  ) => {
    e.preventDefault();
    if (!conv?.isClosed) {
      sendMessage(currentUserId, convId, message, replyingToMessage?.message);
    }
    scrollToBottom();
    setReplyingToMessage(undefined);
    setMessage('');
  };

  const handleSendSecretMessage = async (
    e: any,
    currentUserId: string | undefined,
    convId: string
  ) => {
    // get my keys
    let myKeys;
    try {
      myKeys = JSON.parse(localStorage.getItem(`_cached_keys_${convId}`) || '');
    } catch (err) {
      console.log(err);
    }
    // encryption instance
    let encryption = new E2E(myKeys?.myPublicKey, myKeys?.myPrivateKey, {
      useSameKeyPerClient: false,
    });
    // get other user pub key
    let otherUserPublicKey =
      conv?.publicKeys[
        `${Object.keys(conv?.publicKeys).find(
          (key) => key != Parse.User.current()?.id
        )}`
      ];
    // encrypt the message
    let messageEncrypted = encryption.Encrypt(
      { text: message.text },
      otherUserPublicKey || '',
      { useSameKeyPerClient: false }
    );
    e.preventDefault();
    if (!conv?.isClosed) {
      sendSecretMessage(currentUserId, convId, messageEncrypted);
    }
    scrollToBottom();
    setReplyingToMessage(undefined);
    setMessage('');
  };

  //when clicking add attachment
  const handleClickAddAttachment = () => {
    setShowAddAttachment(!showAddAttachment);
  };

  //handle picture chosen from gallery
  const handleChosenPicture = (e: any) => {
    setShowAddAttachment(false);
    setShowPicture(true);
    setShowSendPictureButton(true);
    setChosenPicture(e.target.files[0]);
    setPictureToShow({ imageUrl: URL.createObjectURL(e.target.files[0]) });
  };
  //send picture chosen from gallery
  const sendChosenPicture = async () => {
    if (chosenPicture != undefined) {
      let parseFile = new Parse.File(chosenPicture?.name, chosenPicture);
      let messageToSend = { image: parseFile };
      setShowSendPictureButton(false);
      setShowPicture(false);
      setChosenPicture(undefined);
      setPictureToShow(undefined);
      await sendMessage(
        Parse.User.current()?.id,
        convId,
        messageToSend,
        replyingToMessage?.message
      ).then((res) => {
        // 1.log(res);
        setReplyingToMessage(undefined);
      });
    }
  };

  //show picture you clicked on
  const showClickedPicture = (msg: any) => {
    if (msg.get('from')?.id != Parse.User.current()?.id) {
      Parse.Cloud.run('setOpenedMessageInfo', {
        messageID: msg.id,
      });
    }
    // Here you should add an event listener for ionBackButton
    // so that when you go back it closes the picture and not the whole chat,
    // and it works but the removeEventListener does not seem to work,
    // or at least when it is removed the other default listeners are not called
    // anymore so the back button basically stops working
    setPictureToShow({
      imageUrl: msg.get('attachment')?.get('file')?._url,
      name: `${msg?.get('from')?.get('firstName')} ${msg
        ?.get('from')
        ?.get('lastName')}`,
      date: `${getMessageDate(msg.get('createdAt'))}, ${msg
        .get('createdAt')
        .getHours()}:${
        msg.get('createdAt').getMinutes() < 10
          ? `0${msg.get('createdAt').getMinutes()}`
          : msg.get('createdAt').getMinutes()
      }`,
    });
    setShowPicture(true);
  };

  const closePicture = () => {
    //here you should remove the event listener
    setShowSendPictureButton(false);
    setShowPicture(false);
    setChosenPicture(undefined);
    setPictureToShow(undefined);
  };

  // adds/removes from selected messages
  const toggleSelectedMessage = (message: Parse.Object<Parse.Attributes>) => {
    let selectedMessagesArray = [...selectedMessages];
    let isPresent = selectedMessagesArray?.some(
      (msg: Parse.Object<Parse.Attributes>) => msg.id == message.id
    );

    if (isPresent) {
      const index = selectedMessagesArray.findIndex(
        (msg) => msg.id == message.id
      );
      let deleted = selectedMessagesArray.splice(index, 1);
    } else {
      selectedMessagesArray.push(message);
    }

    setSelectedMessages(selectedMessagesArray);
  };

  const clearSelectedMessages = () => {
    setSelectedMessages([]);
  };

  const deleteMessagesForMe = () => {
    setShowDeleteMessagesMenu(false);
    let messagesToDelete = selectedMessages.map((msg) => msg.id);
    Parse.Cloud.run('deleteMessagesForMe', {
      messagesToDelete: messagesToDelete,
    });
    setSelectedMessages([]);
  };

  const deleteMessagesForEveryone = () => {
    setShowDeleteMessagesMenu(false);
    let messagesToDelete = selectedMessages.map((msg) => msg.id);
    Parse.Cloud.run('deleteMessagesForEveryone', {
      messagesToDelete: messagesToDelete,
    });
    setSelectedMessages([]);
  };

  const forwardMessages = () => {
    // show contacts list component so you can select which contacts to forward the messages to
    setShowForwardMessagesPage(true);
  };

  const sendEditedMessage = async (e: any) => {
    e.preventDefault();
    let editedMessage = editingMessage.message;
    editedMessage.set('text', editingMessage.newText);
    setEditingMessage({
      message: undefined,
      newText: undefined,
    });
    await editedMessage.save();
  };

  const closeMessageInfo = () => {
    setSelectedMessages([]);
    setShowMessageInfo(undefined);
  };

  const deleteConversationForMe = async () => {
    await Parse.Cloud.run('deleteConversationForMe', { convId: convId });
    // go back to chatList
    history.replace('/tabs/chat/list');
  };

  //scroll to bottom
  const scrollToBottom = () => {
    //scroll to bottom to see messages
    //@ts-ignore
    messagesEndRef.current.scrollIntoView();
  };

  const scheduleMessage = async () => {
    setShowScheduledMessageMenu(false);
    let scheduledMessageParseObj = new Parse.Object('ScheduledMessage')
    scheduledMessageParseObj.set('scheduledAt',scheduledMessageDate || new Date())
    scheduledMessageParseObj.set('conversation', {__type: 'Pointer',className: 'Conversation', objectId: convId});
    scheduledMessageParseObj.set('from', {__type: 'Pointer',className: '_User', objectId: Parse.User.current()?.id});
    scheduledMessageParseObj.set('message',scheduledMessage)

    //@ts-expect-error
    window?.plugins?.toast?.showShortBottom('Scheduling...')

    await scheduledMessageParseObj.save().then(res => {
      setScheduledMessage('')
      //show toast with confirmation message
      //@ts-expect-error
      window.plugins.toast.hide()
      //@ts-expect-error
      window?.plugins?.toast?.showShortBottom('Message scheduled successfully!')
    }).catch(err => {
      //@ts-expect-error
      window?.plugins?.toast?.showShortBottom('There was an error. Check your connection or try again later.')
    })
  }

  return (
    <>
      <IonPage className="chat-page">
        <NotificationPopUp notification={notification} />
        <ChatHeader
          editMessage={(msg: Parse.Object<Parse.Attributes>) => {
            setEditingMessage({ message: msg });
            setSelectedMessages([]);
          }}
          setInfoMessage={() => {
            setShowMessageInfo(selectedMessages[0]);
          }}
          showDeleteMessagesMenu={() => setShowDeleteMessagesMenu(true)}
          selectedMessages={selectedMessages}
          clearSelectedMessages={clearSelectedMessages}
          conversationParticipants={conv?.participants}
          convType={conv?.type}
          isSecret={conv?.isSecret}
          isClosed={conv?.isClosed}
          id={convId}
          avatarUrl={conv?.avatar?._url}
          name={conv?.title}
          setReplyingToMessage={(msg: any) => {
            setSelectedMessages([]);
            setReplyingToMessage(msg);
          }}
          forwardMessages={forwardMessages}
          openScheduledMessagesList={() => setShowScheduledMessagesList(true)}
        />

        <IonContent
          ref={messagesContainerRef}
          scrollEvents={true}
          className="ion-cont"
        >
          <IonRefresher
            className="messages-pulltorefresh"
            slot="fixed"
            onIonRefresh={(e) => {
              refreshMessages(e);
            }}
          >
            <IonRefresherContent
              pullingIcon={chevronDownCircleOutline}
              pullingText="Pull to refresh"
              refreshingSpinner="circles"
              refreshingText="Refreshing..."
            ></IonRefresherContent>
          </IonRefresher>
          <div className="content">
            {messages.map((msg, index) => {
              //set prevMsgDate
              if (index == 0) {
                prevMsgDate = getMessageDate(msg.get('createdAt'));
              } else {
                prevMsgDate = getMessageDate(
                  messages[index - 1].get('createdAt')
                );
              }
              //set msgDate
              msgDate = getMessageDate(msg.get('createdAt')); //get msg date

              //if the date changed show the tooltip
              if (msgDate != prevMsgDate) {
                showTooltip = true;
              } else {
                showTooltip = false;
              }

              //if it is the last show its date
              if (messages[index + 1] == undefined) {
                //if it is the last show 2 tooltips (one is for the group before)
                showTooltip = false;
                isLastMessage = true;
                if (prevMsgDate != msgDate) {
                  showTwoTooltips = true;
                } else {
                  showTwoTooltips = false;
                }
              } else {
                //if there is only one message that day show two tooltips
                if (
                  prevMsgDate != msgDate &&
                  msgDate !=
                    getMessageDate(messages[index + 1].get('createdAt'))
                ) {
                  showTwoTooltips = true;
                } else {
                  showTwoTooltips = false;
                }
              }

              //is the message from me?
              let isFromMe: boolean;
              if (msg.get('from')?.id == undefined) {
                isFromMe =
                  msg.get('from')?.objectId == Parse.User.current()?.id
                    ? true
                    : false;
              } else {
                isFromMe =
                  msg.get('from')?.id == Parse.User.current()?.id
                    ? true
                    : false;
              }

              let senderObj;
              //if we already get the user obj from livequery then set it as senderObj, else find it in participants array
              if (msg.get('from')?.objectId == undefined) {
                senderObj = msg.get('from');
              } else {
                let senderId: string = msg.get('from')?.objectId;
                if (conv?.participants?.length > 0) {
                  senderObj = conv?.participants.find(
                    (user: any) => user.id == senderId
                  );
                } else {
                  //code to query from db if user is not in participants array
                }
              }

              let senderName = `${senderObj?.get('firstName')} ${senderObj?.get(
                'lastName'
              )}`;

              //get message time
              let msgTime = msg.get('createdAt');
              let msgHour = msgTime.getHours();
              let msgMinute =
                msgTime.getMinutes() < 10
                  ? `0${msgTime.getMinutes()}`
                  : msgTime.getMinutes();

              let received = msg.get('received');
              let read = msg.get('read');
              let opened = msg.get('opened');
              let edited = msg.get('editHistory') != undefined;

              let url = msg
                .get('text')
                ?.match(
                  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
                );

              let doesMessageContainURL = url != null ? url : undefined;

              return (
                <React.Fragment key={index}>
                  {/* type == 0 or default: text message, no icon
                  type == 1: voice message, microphone icon
                  type == 2: message with image, picture icon
                  type == 3: message with video, video icon
                  type == 4: message with contact, profile icon
                  type == 5: message with location, map pin icon
                  type == 6: message with file, attachment icon
                */}
                  {showTooltip && !showTwoTooltips && !isLastMessage && (
                    <div className="tooltip">{prevMsgDate}</div>
                  )}
                  {showTwoTooltips && (
                    <div className="tooltip">{prevMsgDate}</div>
                  )}
                  {/* text msg */}
                  {msg.get('type') == 0 && msg.get('from') && (
                    <TextMessage
                      isSingle={isSingle}
                      isFromMe={isFromMe}
                      received={received}
                      read={read}
                      edited={edited}
                      msgHour={msgHour}
                      msgMinute={msgMinute}
                      senderName={senderName}
                      msg={msg}
                      toggleSelectedMessage={toggleSelectedMessage}
                      selected={selectedMessages?.some(
                        (mess: Parse.Object<Parse.Attributes>) =>
                          mess.id == msg.id
                      )}
                      atLeastOneSelectedMessage={
                        selectedMessages?.length > 0 ? true : false
                      }
                      quotedMessage={msg.get('quoted')}
                      setReplyingToMessage={(msg: any) => {
                        setSelectedMessages([]);
                        setReplyingToMessage({ message: msg });
                      }}
                      urlPreview={doesMessageContainURL}
                    />
                  )}
                  {/* audio msg */}
                  {msg.get('type') == 1 && (
                    <VoiceMessage
                      isSingle={isSingle}
                      received={received}
                      read={read}
                      opened={opened}
                      isFromMe={isFromMe}
                      msgHour={msgHour}
                      msgMinute={msgMinute}
                      senderName={senderName}
                      msg={msg}
                      toggleSelectedMessage={toggleSelectedMessage}
                      selected={selectedMessages?.some(
                        (mess: Parse.Object<Parse.Attributes>) =>
                          mess.id == msg.id
                      )}
                      atLeastOneSelectedMessage={
                        selectedMessages?.length > 0 ? true : false
                      }
                      setReplyingToMessage={(msg: any) => {
                        setSelectedMessages([]);
                        setReplyingToMessage({ message: msg });
                      }}
                    />
                  )}
                  {/* image msg */}
                  {msg.get('type') == 2 && (
                    <ImageMessage
                      isSingle={isSingle}
                      received={received}
                      read={read}
                      opened={opened}
                      isFromMe={isFromMe}
                      msgHour={msgHour}
                      msgMinute={msgMinute}
                      senderName={senderName}
                      msg={msg}
                      showClickedPicture={showClickedPicture}
                      toggleSelectedMessage={toggleSelectedMessage}
                      selected={selectedMessages?.some(
                        (mess: Parse.Object<Parse.Attributes>) =>
                          mess.id == msg.id
                      )}
                      atLeastOneSelectedMessage={
                        selectedMessages.length > 0 ? true : false
                      }
                      setReplyingToMessage={(msg: any) => {
                        setSelectedMessages([]);
                        setReplyingToMessage({ message: msg });
                      }}
                      quotedMessage={msg.get('quoted')}
                    />
                  )}
                  {msg.get('type') == 6 && (
                    <FileMessage
                      msg={msg}
                      parseFileName={msg.get('attachment')?.get('file')?._name}
                      parseFileURL={msg.get('attachment')?.get('file')?._url}
                      fileExtension={
                        msg.get('attachment')?.get('file')?._name?.split('.')[
                          msg.get('attachment')?.get('file')?._name?.split('.')
                            ?.length - 1
                        ]
                      }
                      senderName={senderName}
                      msgHour={msgHour}
                      msgMinute={msgMinute}
                      isSingle={isSingle}
                      isFromMe={isFromMe}
                      received={received}
                      read={read}
                      opened={opened}
                      toggleSelectedMessage={toggleSelectedMessage}
                      selected={selectedMessages?.some(
                        (mess: Parse.Object<Parse.Attributes>) =>
                          mess.id == msg.id
                      )}
                      atLeastOneSelectedMessage={
                        selectedMessages.length > 0 ? true : false
                      }
                      setReplyingToMessage={(msg: any) => {
                        setSelectedMessages([]);
                        setReplyingToMessage({ message: msg });
                      }}
                      quotedMessage={msg.get('quoted')}
                    />
                  )}
                  {msg.get('type') == 0 && msg.get('from') == undefined && (
                    <SystemMessage message={msg.get('text')} />
                  )}
                  {!showTooltip && isLastMessage && (
                    <div className="tooltip">{msgDate}</div>
                  )}
                </React.Fragment>
              );
            })}
            {showDownloadButton ? (
              <IonButton
                fill="clear"
                className="loadmore-btn"
                onClick={queryPast}
              >
                LOAD MORE MESSAGES
              </IonButton>
            ) : (
              <></>
            )}
          </div>
          {/* dummy div to scroll to when loading page / sending msg */}
          <div
            style={{ float: 'left', clear: 'both' }}
            ref={messagesEndRef}
          ></div>
        </IonContent>
        {/* ShowPicture div */}
        {showPicture && (
          <ShowPicture
            closePicture={closePicture}
            sendChosenPicture={sendChosenPicture}
            showSendPictureButton={showSendPictureButton}
            pictureToShow={pictureToShow}
          />
        )}
        {/* show delete messages menu */}
        {showDeleteMessagesMenu && (
          <div className="delete-messages-menu-container">
            <button onClick={() => setShowDeleteMessagesMenu(false)}></button>
            <div className="delete-messages-menu-popup">
              <button onClick={deleteMessagesForMe}>
                <h4 style={{ padding: '0', margin: '0', fontWeight: 400 }}>
                  Delete for me
                </h4>
              </button>
              {areAllSelectedMessagesFromMe && (
                <button
                  style={{
                    paddingTop: '10px',
                  }}
                  onClick={deleteMessagesForEveryone}
                >
                  <h4
                    style={{
                      padding: '0',
                      margin: '0',
                      fontWeight: 400,
                    }}
                  >
                    Delete for everyone
                  </h4>
                </button>
              )}
            </div>
          </div>
        )}
        {conv && !conv?.isSecret && !conv?.isClosed ? (
          <>
            {editingMessage.message != undefined ? (
              <IonFooter className="footer">
                <IonButtons className="attachment-button-container">
                  <IonButton
                    onClick={(e) => {
                      setEditingMessage({
                        message: undefined,
                        newText: undefined,
                      });
                    }}
                  >
                    <IonIcon icon={closeOutline} className="icon" />
                  </IonButton>
                </IonButtons>
                {messageIncludesLink && (
                  <div className="footer-link-preview">
                    <LinkPreview url={messageIncludesLink} view="footer" />
                  </div>
                )}
                <form
                  className="message_form"
                  onSubmit={(e) => sendEditedMessage(e)}
                >
                  <IonTextarea
                    rows={1}
                    autoGrow
                    className="input chat-msg-input"
                    value={
                      editingMessage.newText != undefined
                        ? editingMessage.newText
                        : editingMessage?.message?.get('text')
                    }
                    onIonChange={(e) => {
                      if (e.detail.value === undefined) return;
                      setEditingMessage((editingMessage: any) => ({
                        ...editingMessage,
                        newText: e.detail.value,
                      }));
                    }}
                  />
                  <div className="footer-icon-send">
                    <button type="submit" className="icon_button">
                      <IonIcon icon={send} className="send_icon" />
                    </button>
                  </div>
                </form>
              </IonFooter>
            ) : (
              <IonFooter className="footer">
                {replyingToMessage != undefined && (
                  <>
                    <MessageToReplyTo
                      cancelReplyingToMessage={() => {
                        setReplyingToMessage(undefined);
                      }}
                      message={replyingToMessage?.message}
                    />
                  </>
                )}
                {messageIncludesLink && (
                  <div className="footer-link-preview">
                    <LinkPreview url={messageIncludesLink} view="footer" />
                  </div>
                )}
                {/* add attachment */}
                {showAddAttachment && (
                  <AddAttachment
                    convId={convId}
                    setShowAddAttachment={setShowAddAttachment}
                    handleClickAddAttachment={handleClickAddAttachment}
                    handleChosenPicture={handleChosenPicture}
                    messageToReplyTo={replyingToMessage?.message}
                    setReplyingToMessage={(value: boolean) =>
                      setReplyingToMessage(value)
                    }
                    scheduleMessage={() => {setShowAddAttachment(false); setShowScheduledMessageMenu(true)}}
                  />
                )}
                <IonButtons className="attachment-button-container">
                  <IonButton
                    onClick={(e) => {
                      handleClickAddAttachment();
                      e.stopPropagation();
                    }}
                  >
                    <IonIcon icon={addOutline} className="icon" />
                  </IonButton>
                </IonButtons>
                <form
                  className="message_form"
                  onSubmit={(e) =>
                    handleSendMessage(e, Parse.User?.current()?.id, convId)
                  }
                >
                  <IonTextarea
                    rows={1}
                    autoGrow
                    maxlength={500}
                    className="input chat-msg-input"
                    value={message?.text}
                    placeholder="Type your message"
                    onIonChange={(e) => {
                      if (e.detail.value === undefined) return;
                      setMessage({ ...message, text: e.detail.value });
                    }}
                  />
                  {message?.text == undefined || message?.text == '' ? (
                    <>
                      <div className="footer-mic-icon-placeholder"></div>
                      <div className="footer-voice-recorder">
                        <VoiceRecorder
                          type="chat"
                          convId={convId}
                          messageToReplyTo={replyingToMessage?.message}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="footer-icon-send">
                      <button type="submit" className="icon_button">
                        <IonIcon icon={send} className="send_icon" />
                      </button>
                    </div>
                  )}
                </form>
              </IonFooter>
            )}
          </>
        ) : (
          <>
            {conv &&
            conv?.publicKeys &&
            Object?.keys(conv?.publicKeys)?.length == 2 &&
            !conv?.isClosed ? (
              <>
                <IonFooter className="footer secret-chat-footer">
                  <form
                    className="message_form secret-chat-footer"
                    onSubmit={(e) =>
                      handleSendSecretMessage(
                        e,
                        Parse.User?.current()?.id,
                        convId
                      )
                    }
                  >
                    <IonTextarea
                      rows={1}
                      autoGrow
                      maxlength={500}
                      className="input chat-msg-input"
                      value={message?.text}
                      placeholder="Type your message"
                      onIonChange={(e) => {
                        if (e.detail.value === undefined) return;
                        setMessage({ ...message, text: e.detail.value });
                      }}
                    />
                    <div className="footer-icon-send">
                      <button type="submit" className="icon_button">
                        <IonIcon icon={send} className="send_icon" />
                      </button>
                    </div>
                  </form>
                </IonFooter>
              </>
            ) : (
              <>
                {/* prettier-ignore */}
                {(conv == undefined || conv?.isClosed) && (
                  <IonFooter className="footer closed-footer">
                    <h5>Conversation closed.</h5>
                    <button onClick={deleteConversationForMe}>DELETE</button>
                  </IonFooter>
                )}
                {conv && !conv?.isClosed && (
                  <IonFooter className="footer waiting-footer">
                    <h5>Waiting for the other user...</h5>
                  </IonFooter>
                )}
              </>
            )}
          </>
        )}
      </IonPage>
      {showMessageInfo != undefined && (
        <MessageInfo
          isSingle={isSingle}
          closeMessageInfo={closeMessageInfo}
          msg={selectedMessages[0]}
        ></MessageInfo>
      )}
      {showForwardMessagesPage && (
        <ForwardMessages
          closeForward={() => {
            setShowForwardMessagesPage(false);
            setSelectedMessages([]);
          }}
          messagesToForward={selectedMessages}
          convId={convId}
        />
      )}
      {showScheduledMessageMenu && 
      <div className="show-scheduled-message-menu-container">
        <div className="scheduled-message-menu-menu">
          <h4 style={{padding: 0, margin: '0px 0px 5px 0px'}}>Message:</h4>
          <IonTextarea
            rows={1}
            autoGrow
            maxlength={500}
            className="input scheduled-message-input"
            value={scheduledMessage}
            placeholder="Type your message"
            onIonChange={(e) => {
              if (e.detail.value === undefined) return;
              setScheduledMessage(e.detail.value || '');
            }}
            />
            <h4 style={{padding: 0, margin: 0}}>
              Date:
            </h4>
            <IonDatetime 
              displayFormat="MMM DD, YYYY HH:mm"
              max={`${new Date().getFullYear()+1}`}
              min={new Date().toISOString()}
              placeholder={`${new Date().toLocaleString()}`}
              onIonChange={e => setScheduledMessageDate(new Date(e.detail.value || ''))}
              className="scheduled-message-datetime"
            />
            <div className="scheduled-message-buttons">
              <h4>
                <button onClick={() => {setShowScheduledMessageMenu(false); setScheduledMessage(''); setScheduledMessageDate(undefined)}}>
                  CANCEL
                </button>
              </h4>
              <h4>
                <button onClick={() => {
                  if(scheduledMessage.length > 0){
                    scheduleMessage();
                  } else {
                    alert('The message cannot be empty')
                  }
                }}>
                  SCHEDULE
                </button>
              </h4>
            </div>
        </div>
      </div>}
      {showScheduledMessagesList && <ScheduledMessagesList closeScheduledMessagesList={() => {setShowScheduledMessagesList(false)}} convId={convId}/>}
    </>
  );
};

const mapStateToProps = (state: any) => ({
  notification: state?.notification,
  conv: state?.conversation,
});
export default connect(mapStateToProps)(Chat);
