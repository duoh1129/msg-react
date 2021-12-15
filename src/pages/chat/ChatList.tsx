import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
} from '@ionic/react';
import Header from 'src/components/Header/Header';
import Hammer from 'react-hammerjs';

// customized component
import ChatCard from 'src/components/ChatList/ChatCard';
import { chevronDownCircleOutline } from 'ionicons/icons';
import { connect } from 'react-redux';
import NotificationPopUp from 'src/components/notification/NotificationPopUp';

import 'src/assets/sass/messagenius/pages/chat/ChatList.scss';
import Parse from 'parse';

export const addNewChat = (newChat: Parse.Object<Parse.Attributes>) => {
  //@ts-ignore
  if (ChatList.addNewChat) {
    //@ts-ignore
    ChatList.addNewChat(newChat);
  }
};

export const updateChat = (updatedChat: Parse.Object<Parse.Attributes>) => {
  //@ts-ignore
  if (ChatList.updateChat) {
    //@ts-ignore
    ChatList.updateChat(updatedChat);
  }
};

export const deleteChat = (deletedChat: Parse.Object<Parse.Attributes>) => {
  //@ts-ignore
  if (ChatList.deleteChat) {
    //@ts-ignore
    ChatList.deleteChat(deletedChat);
  }
};

export const archiveChatLocal = (chatId: string) => {
  //@ts-ignore
  if (ChatList.archiveChatLocal) {
    //@ts-ignore
    ChatList.archiveChatLocal(chatId);
  }
};

export const deArchiveChatLocal = (chatId: string) => {
  //@ts-ignore
  if (ChatList.deArchiveChatLocal) {
    //@ts-ignore
    ChatList.deArchiveChatLocal(chatId);
  }
};

interface RProps {
  notification: any;
}

const ChatList: React.FC<RProps> = ({ notification }) => {
  const Chat: any = Parse.Object.extend('Conversation');
  const querychats: any = new Parse.Query<Parse.Object<Parse.Attributes>>(Chat);
  const [chats, setChats] = useState<Parse.Object<Parse.Attributes>[]>([]);
  const [archivedChats, setArchivedChats] = useState<any>([]);
  const [selectedChats, setSelectedChats] = useState<
    Parse.Object<Parse.Attributes>[]
  >([]);

  const [showArchivedChats, setShowArchivedChats] = useState<boolean>(false);

  const archivedChatIds = useRef<string[]>([]);

  let n = 0; //counter, every time it increases it will load 50 more users
  let downloadedAll = false;
  const [showDownloadedAll, setShowDownloadedAll] = useState<boolean>(false);

  const chatsPerQuery = 20; //how many chats per query

  useEffect(() => {
    setSelectedChats([]);

    const chatQueryResults = async (
      results: Parse.Object<Parse.Attributes>[],
      online: boolean,
      areArchivedChats: boolean
    ) => {
      let chatsArray: Parse.Object<Parse.Attributes>[] = [];
      for (const res of results) {
        //if the query did not return the participants query them (if online)
        if (res.get('participants')?.length == undefined && online) {
          await res
            .get('participants')
            .query()
            .include('avatar')
            .notEqualTo('objectId', Parse.User.current()?.id)
            .find()
            .then((users: any) => {
              res.set('participants', users);
            });
        }
        if (res.get('type') !== 1) {
          // if it's online we can get the participant object right away
          if (online) {
            let otherParticipant = res
              .get('participants')
              .find((user: any) => user?.id != Parse.User.current()?.id); // get the other participant
            res.set(
              'title',
              `${otherParticipant.get('firstName')} ${otherParticipant.get(
                'lastName'
              )}`
            ); // set title as the other participant's name
            res.set('avatar', otherParticipant.get('avatar')?.get('thumb')); // set other participant's avatar
            chatsArray.push(res);
          } else {
            // if we're offline then get the participant's id
            let otherParticipant = res
              .get('participants')
              .find((user: any) => user?.objectId != Parse.User.current()?.id);

            // if the other participant is defined in the object then set the title with it, otherwise find the participant object among the cached contacts list
            if (
              otherParticipant.get('firstName') != undefined &&
              otherParticipant.get('lastName') != undefined
            ) {
              res.set(
                'title',
                `${otherParticipant.get('firstName')} ${otherParticipant.get(
                  'lastName'
                )}`
              );
            } else {
              // find the user
              let users = JSON.parse(
                localStorage.getItem('_cached_contacts_list') || ''
              );
              // create the parse object
              let participant = Parse.Object.fromJSON({
                ...users.find(
                  (user: any) => user?.objectId == otherParticipant?.id
                ),
                className: '_User',
              });
              // set the title
              res.set(
                'title',
                `${participant.get('firstName')} ${participant.get('lastName')}`
              );
            }

            chatsArray.push(res);
          }
        } else {
          chatsArray.push(res);
        }
      }
      //set users
      n++; //increase counter
      if (n == 1 && online) {
        setChats([]);
        setArchivedChats([]);
      } //if its the first iteration or we are searching something, setUsers to nothing before going on

      if (!areArchivedChats && results.length < chatsPerQuery && online) {
        //if this is the last query with results, set downloadedAll
        downloadedAll = true;
        setShowDownloadedAll(true);
      }

      if (n > 1) {
        if (areArchivedChats) {
          setArchivedChats((archivedChats: any) =>
            archivedChats.concat(chatsArray)
          ); //set chats
        } else {
          setChats((chats) => chats.concat(chatsArray)); //set chats
        }
      } else {
        if (areArchivedChats) {
          setArchivedChats(chatsArray);
        } else {
          setChats(chatsArray);
        }
      }
    };
    const setChatsToCachedChats = async (
      results: Parse.Object<Parse.Attributes>[],
      archived: boolean
    ) => {
      let chatsArray: Parse.Object<Parse.Attributes>[] = [];
      for (const res of results) {
        if (res.get('type') !== 1) {
          // get the participant's id
          let otherParticipant: any;
          if (res?.get('participants')?.find) {
            otherParticipant = res
              ?.get('participants')
              ?.find(
                (user: any) =>
                  (user?.id || user?.objectId) != Parse.User.current()?.id
              );
          }

          // if the other participant is defined in the object then set the title with it, otherwise find the participant object among the cached contacts list
          if (
            otherParticipant?.get('firstName') != undefined &&
            otherParticipant?.get('lastName') != undefined
          ) {
            res.set(
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
            res.set(
              'title',
              `${participant.get('firstName')} ${participant.get('lastName')}`
            );
          }
          chatsArray.push(res);
        } else {
          chatsArray.push(res);
        }
      }
      if (archived) {
        setArchivedChats(chatsArray); //set archived chats
      } else {
        setChats(chatsArray); // set chats
      }
    };
    const chatquery = async (isRefreshing: boolean) => {
      //Query settings, will query all chats we have access to
      querychats.descending('updatedAt'); // order
      querychats.include('lastMessage');
      querychats.include('participants');
      querychats.include('admins');

      if (isRefreshing) {
        setShowDownloadedAll(false);
        downloadedAll = false;
        n = 0;
      }

      querychats
        .skip(n * chatsPerQuery) //skip already downlaoded users
        .limit(chatsPerQuery); //limit to x users per query

      const ConversationInfoQuery = new Parse.Query('ConversationInfo')
        .equalTo('isArchived', true)
        .equalTo('user', Parse.User.current())
        .include('conversation');
      await ConversationInfoQuery.find().then((res) => {
        archivedChatIds.current = res.map((obj) => obj.get('conversation').id);
      });

      if (!downloadedAll) {
        await querychats.find().then(async (res: any) => {
          let notArchivedChats = res.filter(
            (chat: Parse.Object<Parse.Attributes>) =>
              !archivedChatIds.current.includes(chat.id)
          );
          let archivedChats = res.filter(
            (chat: Parse.Object<Parse.Attributes>) =>
              archivedChatIds.current.includes(chat.id)
          );
          if (n == 0) {
            // if it's the first query initialize the storage items
            localStorage.setItem(
              '_cached_conversation_list',
              JSON.stringify(notArchivedChats)
            );
            localStorage.setItem(
              '_cached_archived_conversation_list',
              JSON.stringify(archivedChats)
            );
          } else {
            // if it's not the first query then get the conversations before it and concatenate with the new results
            let cachedResults =
              JSON.parse(
                localStorage.getItem('_cached_conversation_list') || ''
              ) || [];
            let cachedResultsPlusQueryResults = [
              ...cachedResults,
              notArchivedChats,
            ];
            localStorage.setItem(
              '_cached_conversation_list',
              JSON.stringify(cachedResultsPlusQueryResults)
            );

            // do the same for archived chats
            let cachedResultsArchived =
              JSON.parse(
                localStorage.getItem('_cached_archived_conversation_list') || ''
              ) || [];
            let cachedResultsArchivedPlusQueryResults = [
              ...cachedResultsArchived,
              archivedChats,
            ];
            localStorage.setItem(
              '_cached_archived_conversation_list',
              JSON.stringify(cachedResultsArchivedPlusQueryResults)
            );
          }
          chatQueryResults(notArchivedChats, true, false);
          chatQueryResults(archivedChats, true, true);
        });
      }
      return true;
    };
    const showCachedChats = async () => {
      let cachedResults =
        JSON.parse(localStorage.getItem('_cached_conversation_list') || '') ||
        [];

      let parseObjects: Parse.Object<Parse.Attributes>[] = [];

      if (cachedResults.length > 0) {
        // we need to modify the objects from localStorage adding the className to the objects so that we can then turn them back into parseObjects
        for await (let result of cachedResults) {
          let resultModified = { ...result, className: 'Conversation' }; // adding the className property
          let parseObj = Parse.Object.fromJSON(resultModified); // creating the parse object
          parseObjects = [...parseObjects, parseObj]; // adding the objects to the array
        }
        setChatsToCachedChats(parseObjects, false);
      }
      let cachedResultsArchived =
        JSON.parse(
          localStorage.getItem('_cached_archived_conversation_list') || ''
        ) || [];

      let parseObjectsArchived: Parse.Object<Parse.Attributes>[] = [];

      if (cachedResultsArchived.length > 0) {
        // we need to modify the objects from localStorage adding the className to the objects so that we can then turn them back into parseObjects
        for await (let result of cachedResultsArchived) {
          let resultModified = { ...result, className: 'Conversation' }; // adding the className property
          let parseObj = Parse.Object.fromJSON(resultModified); // creating the parse object
          parseObjectsArchived = [...parseObjectsArchived, parseObj]; // adding the objects to the array
        }
        setChatsToCachedChats(parseObjectsArchived, true);
      }
    };
    showCachedChats(); // show cached chats to start with
    chatquery(false);
    //@ts-expect-error
    useEffect.chatquery = chatquery;
  }, []);

  const addNewChat = async (chat: Parse.Object<Parse.Attributes>) => {
    if (chat.get('type') !== 1) {
      if (chat.get('participants')?.length == undefined) {
        await chat
          .get('participants')
          .query()
          .notEqualTo('objectId', Parse.User.current()?.id)
          .first()
          .then((user: Parse.Object<Parse.Attributes>) => {
            chat.set(
              'title',
              `${user.get('firstName')} ${user.get('lastName')}`
            );
            chat.set('avatar', user.get('avatar'));
            setChats([chat, ...chats]);
          });
      } else {
        // we already have the array of users
        let users = [...chat.get('participants')];
        let otherUser = users.find((u) => u?.id !== Parse.User.current()?.id);
        chat.set(
          'title',
          `${otherUser.get('firstName')} ${otherUser.get('lastName')}`
        );
        chat.set('avatar', otherUser.get('avatar'));
        setChats([chat, ...chats]);
      }
    } else {
      setChats([chat, ...chats]);
    }
  };
  //@ts-ignore
  ChatList.addNewChat = addNewChat;

  const updateChat = async (chat: Parse.Object<Parse.Attributes>) => {
    let chatsArray = [...chats];
    const index = chats.findIndex((obj) => obj?.id == chat?.id);
    let outdated = chatsArray.splice(index, 1);
    setChats([chat, ...chatsArray]);
  };
  //@ts-ignore
  ChatList.updateChat = updateChat;

  const deleteChat = async (chat: Parse.Object<Parse.Attributes>) => {
    let chatsArray = [...chats];
    const index = chats.findIndex((obj) => obj?.id == chat?.id);
    let deleted = chatsArray.splice(index, 1);
    setChats(chatsArray);
  };
  //@ts-ignore
  ChatList.deleteChat = deleteChat;

  const archiveChatLocal = (chatId: string) => {
    let chatsArray = [...chats];
    let index = chatsArray.findIndex((obj) => obj?.id == chatId);
    if(index >= 0){
      let archived = chatsArray.splice(index, 1);
      archivedChatIds.current.push(chatId);
      setChats(chatsArray);
      setArchivedChats((archivedChats: any) => [archived[0], ...archivedChats]);
      // remove from localstorage chats and add to localstorage archivedChats
      let cached = JSON.parse(
        localStorage.getItem('_cached_archived_conversation_list') || ''
      ) || [];
    let removedLS = cached.splice(cached.findIndex((c:any) => c.id == chatId),1);
    localStorage.setItem('_cached_conversation_list',JSON.stringify(cached));

    let cachedArchived = 
        JSON.parse(
          localStorage.getItem('_cached_archived_conversation_list') || ''
        ) || [];
      cachedArchived = [archived[0], ...cachedArchived];
      localStorage.setItem('_cached_archived_conversation_list',JSON.stringify(cachedArchived));
    }
  };
  //@ts-ignore
  ChatList.archiveChatLocal = archiveChatLocal;

  const deArchiveChatLocal = async (chatId: string) => {
    let archivedChatsArray = [...archivedChats];
    let index = archivedChatsArray.findIndex((obj) => obj?.id == chatId);
    if(index >= 0){
      let indexId = archivedChatIds.current.findIndex(id => id == chatId);
      let removedId = archivedChatIds.current.splice(indexId,1);
      let deArchived = archivedChatsArray.splice(index, 1);
      setArchivedChats(archivedChatsArray);
      setChats((chats: any) => [deArchived[0], ...chats]);
      // remove from cached and put into chats
      let cachedArchived = await JSON.parse(
        await localStorage.getItem('_cached_archived_conversation_list') || ''
      ) || [];
      let removedLS = cachedArchived.splice(cachedArchived.findIndex((c:any) => c.id == chatId),1);
      localStorage.setItem('_cached_archived_conversation_list',JSON.stringify(cachedArchived));

      let cached = 
        await JSON.parse(
          await localStorage.getItem('_cached_conversation_list') || ''
        ) || [];
      cached = [deArchived[0], ...cached];
      await localStorage.setItem('_cached_conversation_list',JSON.stringify(cached));

      
    }
  };
  //@ts-ignore
  ChatList.deArchiveChatLocal = deArchiveChatLocal;

  const queryNext = ($event: CustomEvent<void>) => {
    //@ts-ignore
    useEffect.chatquery(false);
    ($event.target as HTMLIonInfiniteScrollElement).complete();
  };

  const refreshChatList = async (e: CustomEvent) => {
    // setChats([]);  //remove comment to make chats disappear during refresh
    //@ts-ignore
    await useEffect.chatquery(true).then(() => {
      e.detail.complete();
    });
  };

  //! still getting the schema mismatch error
  const archiveChat = async (chat: any) => {
    let queryChatInfo = new Parse.Query('ConversationInfo')
      .equalTo('user', {
        __type: 'Pointer',
        className: '_User',
        objectId: Parse.User.current()?.id,
      })
      .equalTo('conversation', {
        __type: 'Pointer',
        className: 'Conversation',
        objectId: chat?.id,
      });
    await queryChatInfo.first().then(async (conversationInfo) => {
      conversationInfo?.set('isArchived', true);
      await conversationInfo
        ?.save()
        .catch((err) => console.error(JSON.stringify(err)));
    });
  };

  const deArchiveChat = async (chat: Parse.Object<Parse.Attributes>) => {
    let queryChatInfo = new Parse.Query('ConversationInfo')
      .equalTo('user', {
        __type: 'Pointer',
        className: '_User',
        objectId: Parse.User.current()?.id,
      })
      .equalTo('conversation', {
        __type: 'Pointer',
        className: 'Conversation',
        objectId: chat?.id,
      });
    await queryChatInfo.first().then(async (conversationInfo) => {
      conversationInfo?.set('isArchived', false);
      await conversationInfo
        ?.save()
        .catch((err) => console.error(JSON.stringify(err)));
    });
  };

  const toggleSelectedChat = (chat: Parse.Object<Parse.Attributes>) => {
    if (selectedChats.includes(chat)) {
      let selectedChatsArray = [...selectedChats];
      const index = selectedChatsArray.findIndex((conv) => conv.id == chat.id);
      let deleted = selectedChatsArray.splice(index, 1);
      // 20ms so that it does not open the chat
      setTimeout(() => {
        setSelectedChats([...selectedChatsArray]);
      }, 20);
    } else {
      setSelectedChats((selectedChats) => [...selectedChats, chat]);
    }
  };

  const archiveChats = async (chats: Parse.Object<Parse.Attributes>[]) => {
    for await (const chat of chats) {
      if (archivedChats.includes(chat)) {
        // remove from archived
        deArchiveChat(chat);
      } else {
        //archive
        archiveChat(chat);
      }
    }
    setSelectedChats([]);
  };

  const deleteChatsForMe = async (chats: Parse.Object<Parse.Attributes>[]) => {
    for await (const chat of chats) {
      await Parse.Cloud.run('deleteConversationForMe', { convId: chat.id });
    }
    setSelectedChats([]);
  };

  return (
    <>
      <IonPage>
        <NotificationPopUp notification={notification} />
        <Header
          showingArchivedChats={showArchivedChats}
          toggleShowArchivedChats={() =>
            setShowArchivedChats(!showArchivedChats)
          }
          numberOfSelectedChats={selectedChats.length}
          deleteChats={() => deleteChatsForMe([...selectedChats])}
          archiveChats={() => archiveChats([...selectedChats])}
        />
        <IonContent>
          <IonRefresher
            slot="fixed"
            onIonRefresh={(e) => {
              refreshChatList(e);
            }}
          >
            <IonRefresherContent
              pullingIcon={chevronDownCircleOutline}
              pullingText="Pull to refresh"
              refreshingSpinner="circles"
              refreshingText="Refreshing..."
            ></IonRefresherContent>
          </IonRefresher>
          <IonList>
            {/* @ts-ignore */}
            {(showArchivedChats ? archivedChats : chats)?.map((chat, index) => {
              return (
                <>
                  <Hammer
                    onPress={() => {
                      if (selectedChats.length == 0) {
                        // toggle selected chat
                        toggleSelectedChat(chat);
                      }
                    }}
                    onTap={() => {
                      if (selectedChats.length > 0) {
                        // toggle selected on chat
                        toggleSelectedChat(chat);
                      }
                    }}
                  >
                    <div>
                      <ChatCard
                        // TODO set muted, flagged, deleted, receipt
                        isSingle={chat?.get && chat?.get('isSingle')}
                        participants={chat?.get && chat?.get('participants')}
                        muted={false}
                        flagged={false}
                        deleted={false}
                        received={chat?.get && chat?.get('lastMessage')?.get('received')}
                        read={chat?.get && chat?.get('lastMessage')?.get('read')}
                        opened={chat?.get && chat?.get('lastMessage')?.get('opened')}
                        parseObj={chat}
                        key={index}
                        isSelected={selectedChats?.includes(chat)}
                      />
                    </div>
                  </Hammer>
                </>
              );
            })}
            <IonInfiniteScroll
              threshold="300px"
              disabled={false}
              onIonInfinite={(e: CustomEvent<void>) => queryNext(e)}
            >
              <IonInfiniteScrollContent loadingText="Loading more chats..."></IonInfiniteScrollContent>
            </IonInfiniteScroll>
            {showDownloadedAll && (
              <IonLabel text-center>
                <b>There are no more chats.</b>
              </IonLabel>
            )}
          </IonList>
        </IonContent>
      </IonPage>
    </>
  );
};

const mapStateToProps = (state: any) => ({
  notification: state.notification,
});
export default connect(mapStateToProps)(ChatList);
