import {
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonPage,
  IonTextarea,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import ChatInfoHeader from 'src/components/Header/ChatInfoHeader';
import { connect } from 'react-redux';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import { Avatar, CircularProgress } from '@material-ui/core';
import Parse from 'parse';

import 'src/assets/sass/messagenius/pages/chat/ChatInfo.scss';
import ParticipantCard from 'src/components/chatInfo/ParticipantCard';
import {
  cameraOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeCircleOutline,
  closeOutline,
  createOutline,
  imageOutline,
} from 'ionicons/icons';
import store from 'src/services/redux/store';
import NotificationPopUp from 'src/components/notification/NotificationPopUp';
import { queryHelpers } from '@testing-library/react';
import { useTakePicture } from 'src/functions/chat/hooks/useTakePicture';
import { isReturnStatement } from 'typescript';
import AddContactsToGroup from '../group/AddContactsToGroup';
import E2E from 'e2e-encryption';

const lqConv = async (convId: string) => {
  let query = new Parse.Query('Conversation');
  query.equalTo('objectId', convId).include('participants').include('admins');
  let sub = await query.subscribe();
  sub.on('update', (conv) => {
    //@ts-ignore
    ChatInfo.updateConv(conv);
  });
  sub.on('delete', () => {
    //@ts-ignore
    ChatInfo.deleteConv();
  });
  const unsub = () => {
    sub.unsubscribe();
  };
  //@ts-ignore
  lqConv.unsub = unsub;
};

const ChatInfo = (props: any) => {
  //@ts-expect-error
  const convId = useParams().conversationId;

  let history = useHistory();

  let avatarStyle;

  if (props?.conv?.get) {
    avatarStyle = {
      backgroundColor: `#${getAvatarColor(
        props?.conv?.get('title') || 'XFSEASD'
      )}`, //function from functions/cards
    };
  } else {
    avatarStyle = {
      backgroundColor: `#${getAvatarColor('XFSEASD')}`, //function from functions/cards
    };
  }

  const [isSingle, setIsSingle] = useState<boolean>();
  const [otherUser, setOtherUser] = useState<Parse.Object<Parse.Attributes>>();
  const [isOnline, setIsOnline] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [
    showChangeProfilePictureSelection,
    setShowChangeProfilePictureSelection,
  ] = useState(false);
  const [chosenPicture, setChosenPicture] = useState<any>(undefined);
  const [pictureToShow, setPictureToShow] = useState<any>({});
  const [showPicture, setShowPicture] = useState(false);
  const [showSendPictureButton, setShowSendPictureButton] = useState(false);
  const [showLoadingPicture, setShowLoadingPicture] = useState<boolean>(false);
  const [showEditTitle, setShowEditTitle] = useState<boolean>(false);
  const [showTitleError, setShowTitleError] = useState<boolean>(false);
  const [title, setTitle] = useState<string | undefined | null>('');
  const [selectedUser, setSelectedUser] = useState<
    undefined | Parse.Object<Parse.Attributes>
  >(undefined);
  const [goingToChat, setGoingToChat] = useState<boolean>(false); // this is because props.conv.get is not a function when we load a chat so we need to show nothing when a chat is created.
  const [addingUser, setAddingUser] = useState<boolean>(false);

  const [editingGroupDescription, setEditingGroupDescription] = useState(false); // editing group description
  const [groupDescription, setGroupDescription] = useState<string | undefined>(
    undefined
  ); // group description
  //custom hooks
  const { takePhoto } = useTakePicture(); //takePhoto hook

  let oldTitle = '';
  if (props?.conv?.get) {
    oldTitle = props?.conv?.get('title');
  }

  let userMenuOptions = [
    {
      show: () => true,
      buttonName: 'Chat',
      onClick: async (otherUser: Parse.Object<Parse.Attributes>) => {
        createChatWithUser(otherUser);
      },
    },
    {
      show: () => true,
      buttonName: 'Start secret chat',
      onClick: async (otherUser: Parse.Object<Parse.Attributes>) => {
        createSecretChatWithUser(otherUser);
      },
    },
    {
      //prettier-ignore
      show: () => (
        props.conv
          ?.get('admins')
          ?.some((adm: any) => adm.id == selectedUser?.id) && isCurrentUserAdmin),
      buttonName: 'Remove from admins',
      onClick: () => {
        removeUserFromAdmins(selectedUser);
      },
    },
    {
      //prettier-ignore
      show: () => (
        !(props.conv
          ?.get('admins')
          ?.some((adm: any) => adm.id == selectedUser?.id)) && isCurrentUserAdmin),
      buttonName: 'Add to admins',
      onClick: () => {
        addUserToAdmins(selectedUser);
      },
    },
    {
      show: () => isCurrentUserAdmin,
      buttonName: 'Remove from the group',
      onClick: () => {
        removeUserFromGroup(selectedUser);
      },
    },
  ];

  //check if title has an error
  useEffect(() => {
    //@ts-expect-error
    if (title?.length < 1 || title?.length > 20) setShowTitleError(true);
    else setShowTitleError(false);
  });

  //get other user
  useEffect(() => {
    if (props?.conv?.get) {
      props.conv.get('type') == 0 ? setIsSingle(true) : setIsSingle(false);
    }
    const getOtherUser = async () => {
      let otherUser = props.conv
        ?.get('participants')
        .find((partipant: any) => partipant.id != Parse?.User?.current()?.id);
      if (otherUser?.get('profile')) {
        setOtherUser(otherUser);
      } else {
        // query for the profile
        let queryProfile = new Parse.Query('Profile').equalTo('user', {
          __type: 'Pointer',
          className: '_User',
          objectId: Parse.User.current()?.id,
        });
        await queryProfile?.first().then((res) => {
          otherUser?.set('profile', res);
          setOtherUser(otherUser);
        });
      }
    };
    if (props.conv?.get) {
      if (props.conv.get('type') == 0) getOtherUser();
    }

    if (props.conv?.get) {
      setTitle(props.conv.get('title'));
    }
  }, [props.conv]);

  //liveQuery
  useEffect(() => {
    lqConv(convId);
    return () => {
      //@ts-ignore
      lqConv.unsub();
    };
  }, []);

  useEffect(() => {
    if (props.conv?.get) {
      if (props.conv?.get('type') == 0) {
        let otherUserID = props.conv?.get('participants')[1].id;
        let isOnline = props.onlineList?.includes(otherUserID);
        setIsOnline(isOnline);
      }
    }
  }, [props.conv, props.onlineList]);

  useEffect(() => {
    if (props.conv?.get) {
      setIsCurrentUserAdmin(
        props.conv
          ?.get('admins')
          ?.some((adm: any) => adm.id == Parse.User.current()?.id)
          ? true
          : false
      );
    }
  });

  const editTitle = async () => {
    //@ts-expect-error
    if (title?.length > 0 && title != oldTitle) {
      setShowEditTitle(false);
      let convQuery = new Parse.Query('Conversation')
        .equalTo('objectId', convId)
        .includeAll();
      let conversation = await convQuery.first();
      conversation?.set('title', title);
      await conversation?.save();
    } else {
      setShowEditTitle(false);
    }
  };

  const updateConv = (conv: any) => {
    store.dispatch({
      type: 'setConversation',
      value: conv,
    });
  };
  //@ts-ignore
  ChatInfo.updateConv = updateConv;

  const deleteConv = () => {
    store.dispatch({
      type: 'setConversation',
      value: undefined,
    });
    history.replace('/tabs/chat/list');
  };
  //@ts-ignore
  ChatInfo.deleteConv = deleteConv;

  //write changes to db
  const setGroupPicture = async (file: Parse.File) => {
    setShowLoadingPicture(true);
    setShowPicture(false);
    setShowSendPictureButton(false);

    await props.conv
      .set('avatar', file)
      .save()
      .then(() => {
        setChosenPicture(undefined);
        setPictureToShow(undefined);
        setTimeout(() => setShowLoadingPicture(false), 300);
      });
  };

  //take pic from the camera
  const takeCameraPicture = async () => {
    setShowChangeProfilePictureSelection(false);
    await takePhoto().then((res: any) => {
      let parseFile = new Parse.File(res.filepath, {
        base64: res.base64 || '',
      });
      setGroupPicture(parseFile);
    });
  };

  //handle chosen picture (from gallery)
  const handleChosenPicture = (e: any) => {
    setShowChangeProfilePictureSelection(false);
    setShowPicture(true);
    setShowSendPictureButton(true);
    setChosenPicture(e.target.files[0]);
    setPictureToShow({ imageUrl: URL.createObjectURL(e.target.files[0]) });
  };

  //close picture
  const closePicture = () => {
    //here you should remove the event listener
    setShowSendPictureButton(false);
    setShowPicture(false);
    setPictureToShow(undefined);
    setChosenPicture(undefined);
  };

  //create a chat room
  const createChatWithUser = async (
    otherUser: Parse.Object<Parse.Attributes>
  ) => {
    const Conversation = Parse.Object.extend('Conversation');
    const addConversation = new Conversation();
    const currentUser = Parse.User.current();
    const participants = addConversation.relation('participants');
    participants.add(currentUser);
    participants.add(otherUser);
    const admins = addConversation.relation('admins');
    admins.add(currentUser);
    addConversation.set('type', 0);
    addConversation.set('isSecret', false);
    addConversation.set(
      'title',
      `${Parse.User.current()?.get('firstName')} ${Parse.User.current()?.get(
        'lastName'
      )}`
    );
    addConversation
      .save()
      .then((conversation: Parse.Object<Parse.Attributes>) => {
        setGoingToChat(true);
        setTimeout(() => history.replace(`/chat/${conversation.id}`), 300);
      })
      .catch((err: any) => {
        setGoingToChat(true);
        setTimeout(() => history.replace(`/chat/${err.message}`), 300);
      });
  };

  //create a chat room with the user you clicked on
  const createSecretChatWithUser = async (
    otherUser: Parse.Object<Parse.Attributes>
  ) => {
    const Conversation = Parse.Object.extend('Conversation');
    const addConversation = new Conversation();
    const currentUser = Parse.User.current();
    const participants = addConversation.relation('participants');
    participants.add(currentUser);
    participants.add(otherUser);
    const admins = addConversation.relation('admins');
    admins.add(currentUser);
    addConversation.set('isSecret', true);
    addConversation.set('type', 0);
    addConversation.set(
      'title',
      `${Parse.User.current()?.get('firstName')} ${Parse.User.current()?.get(
        'lastName'
      )}`
    );

    // generate new keys
    let myKeys = new E2E('', '', { useSameKeyPerClient: false });
    addConversation.set(
      'publicKeys',
      // @ts-ignore
      { [Parse.User.current()?.id]: myKeys.publicKey }
    );
    addConversation
      .save()
      .then((conversation: Parse.Object<Parse.Attributes>) => {
        // write the keys in localStorage
        localStorage.setItem(
          `_cached_keys_${conversation.id}`,
          JSON.stringify({
            myPublicKey: myKeys.publicKey,
            myPrivateKey: myKeys.privateKey,
          })
        );
        setGoingToChat(true);
        setTimeout(() => history.replace(`/chat/${conversation.id}`), 300);
      })
      .catch((err: any) => {
        setGoingToChat(true);
        setTimeout(() => history.replace(`/chat/${err.message}`), 300);
      });
  };

  const removeUserFromAdmins = (
    user: Parse.Object<Parse.Attributes> | undefined
  ) => {
    Parse.Cloud.run('removeUserFromAdmins', {
      userToRemove: user?.id,
      convId: props?.conv?.id,
    });
    setSelectedUser(undefined);
  };

  const addUserToAdmins = (
    user: Parse.Object<Parse.Attributes> | undefined
  ) => {
    Parse.Cloud.run('addUserToAdmins', {
      userToAdd: user?.id,
      convId: props?.conv?.id,
    });
    setSelectedUser(undefined);
  };

  const removeUserFromGroup = (
    user: Parse.Object<Parse.Attributes> | undefined
  ) => {
    Parse.Cloud.run('removeUserFromGroup', {
      userToRemove: user?.id,
      conversationId: props?.conv?.id,
    });
    setSelectedUser(undefined);
  };

  const setAddUser = () => {
    setAddingUser(true);
  };

  const cancelAddingUser = () => {
    setAddingUser(false);
  };

  const saveGroupDescription = async () => {
    let query = new Parse.Query('Conversation').equalTo(
      'objectId',
      props.conv?.id
    );
    await query.first().then(async (conversation) => {
      conversation?.set('description', groupDescription);
      await conversation?.save(null).then(() => {
        setGroupDescription(undefined);
        setEditingGroupDescription(false);
      });
    });
  };

  return (
    <>
      {!goingToChat && !addingUser && (
        <IonPage>
          <NotificationPopUp notification={props.notification} />
          <ChatInfoHeader
            addUser={setAddUser}
            admin={
              props.conv
                ?.get('admins')
                ?.some((adm: any) => adm.id == Parse.User.current()?.id)
                ? true
                : false
            }
            conv={props.conv}
            isSingle={isSingle}
            convId={convId}
          />
          <IonContent className="chatinfo-content-container">
            <div className="chatinfo-avatar-area">
              <Avatar
                className="chatinfo-avatar"
                style={avatarStyle}
                src={props.conv?.get('avatar')?._url}
              >
                {props.conv.get('title')?.split(' ')[0].charAt(0).toUpperCase()}
                {props.conv
                  .get('title')
                  ?.split(' ')[1]
                  ?.charAt(0)
                  .toUpperCase()}
                {props.conv
                  .get('title')
                  ?.split(' ')[2]
                  ?.charAt(0)
                  .toUpperCase()}
              </Avatar>
              <div className="profile-picture-loading">
                {showLoadingPicture && <CircularProgress />}
              </div>
              <div className="avatar-text">
                {!isSingle && (
                  <button
                    onClick={() => {
                      setShowChangeProfilePictureSelection(true);
                    }}
                  >
                    Change profile picture
                  </button>
                )}
              </div>
              {isOnline && <div className="chatinfo-isonline">Online</div>}
              {!isSingle && (
                <>
                  <div className="change-avatar-button"></div>
                </>
              )}
            </div>
            {!showEditTitle && (
              <div className="chatinfo-title-area">
                <h2>{props.conv?.get('title')}</h2>
                {!isSingle && (
                  <button
                    style={{ padding: 0, margin: 0 }}
                    onClick={() => setShowEditTitle(true)}
                  >
                    <IonIcon
                      className="chatinfo-edit-title-icon"
                      icon={createOutline}
                    ></IonIcon>
                  </button>
                )}
              </div>
            )}
            {showEditTitle && (
              <div className="chatinfo-grouptitle-input-container">
                <IonInput
                  className="chatinfo-grouptitle-input"
                  value={title}
                  onIonChange={(e) => setTitle(e.detail?.value)}
                />
                <div className="chatinfo-grouptitle-action-icons">
                  <IonIcon
                    className="chatinfo-grouptitle-action-icon"
                    icon={checkmarkCircleOutline}
                    onClick={editTitle}
                  />
                  <IonIcon
                    className="chatinfo-grouptitle-action-icon"
                    icon={closeCircleOutline}
                    onClick={() => {
                      setTitle(props.conv.get('title'));
                      setShowEditTitle(false);
                    }}
                  />
                </div>
              </div>
            )}
            {showTitleError && (
              <div className="chatinfo-title-error">
                Group title must be between 1 and 20 characters.
              </div>
            )}
            <div
              className={`chatinfo-info-area ${
                editingGroupDescription && 'editing-description'
              }`}
            >
              {isSingle ? <h5>Info</h5> : <h5>Description</h5>}
              <h5
                className={`chatinfo-info-text ${
                  editingGroupDescription && 'editing-description'
                }`}
              >
                {isSingle ? (
                  <>
                    {otherUser?.get('profile')?.get('notes') || 'No user info'}
                  </>
                ) : (
                  <>
                    {!editingGroupDescription ? (
                      <>
                        {props.conv.get('description') || 'No description'}
                        <button
                          style={{ padding: 0, margin: 0 }}
                          onClick={() => setEditingGroupDescription(true)}
                        >
                          <IonIcon
                            style={{ color: 'gray' }}
                            className="edit-title-icon"
                            icon={createOutline}
                          ></IonIcon>
                        </button>
                      </>
                    ) : (
                      <div className="group-input-container">
                        <IonTextarea
                          autoGrow
                          spellCheck
                          maxlength={150}
                          rows={3}
                          className="group-input"
                          value={
                            groupDescription ?? props.conv.get('description')
                          }
                          onIonChange={(e: any) =>
                            setGroupDescription(e.detail?.value)
                          }
                        />
                        <div className="group-input-action-icons">
                          <IonIcon
                            className="group-input-action-icon"
                            icon={checkmarkCircleOutline}
                            onClick={() => saveGroupDescription()}
                          />
                          <IonIcon
                            className="group-input-action-icon"
                            icon={closeCircleOutline}
                            onClick={() => {
                              setGroupDescription(undefined);
                              setEditingGroupDescription(false);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </h5>
            </div>
            <div className="group-participants-area">
              {!isSingle && <h5>Participants</h5>}
              {!isSingle && (
                <IonItem className="chatinfo-participant-item" lines="none">
                  <ParticipantCard
                    admin={
                      props.conv
                        ?.get('admins')
                        ?.some((adm: any) => adm.id == Parse.User.current()?.id)
                        ? true
                        : false
                    }
                    participantObj={Parse.User.current()}
                  />
                </IonItem>
              )}
              {!isSingle &&
                props.conv?.get('participants').map((p: any, index: number) => {
                  return (
                    <>
                      {p.id != Parse.User.current()?.id && (
                        <IonItem
                          className="chatinfo-participant-item"
                          onClick={() => setSelectedUser(p)}
                          lines="none"
                          key={index}
                        >
                          <ParticipantCard
                            admin={
                              props.conv
                                ?.get('admins')
                                ?.some((adm: any) => adm.id == p.id)
                                ? true
                                : false
                            }
                            participantObj={p}
                          />
                        </IonItem>
                      )}
                    </>
                  );
                })}
            </div>
          </IonContent>
          {showChangeProfilePictureSelection && (
            <div className="picture-source-selection">
              <button
                className="exit-picture-selection"
                onClick={() => setShowChangeProfilePictureSelection(false)}
              ></button>
              <div className="picture-selection-container">
                <button className="icon_button" onClick={takeCameraPicture}>
                  <IonIcon icon={cameraOutline} className="attachment-icon" />
                  <h4>Take a picture</h4>
                </button>
                <button
                  className="icon_button"
                  onClick={() => {
                    document.getElementById('image-input')?.click();
                  }}
                >
                  <IonIcon icon={imageOutline} className="attachment-icon" />
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleChosenPicture(e)}
                  />
                  <h4>Choose from gallery</h4>
                </button>
              </div>
            </div>
          )}
          {showPicture && (
            <div className="show-picture-container">
              <div className="show-picture-header">
                <div className="close-picture-button">
                  <button onClick={closePicture}>
                    <IonIcon
                      className="show-picture-close-icon"
                      icon={closeOutline}
                    />
                  </button>
                </div>
              </div>
              <img
                className="show-picture-img"
                src={pictureToShow?.imageUrl}
                alt=",,,"
              />
              {showSendPictureButton && (
                <div className="show-picture-footer">
                  <button
                    className="send-picture-button"
                    onClick={() => {
                      let parseFile = new Parse.File(
                        chosenPicture?.name,
                        chosenPicture
                      );
                      setGroupPicture(parseFile);
                    }}
                  >
                    <IonIcon
                      className="show-picture-confirm-icon"
                      icon={checkmarkOutline}
                    />
                  </button>
                </div>
              )}
            </div>
          )}
          {selectedUser != undefined && (
            <>
              <div className="participant-settings-container">
                <button
                  onClick={() => {
                    setSelectedUser(undefined);
                  }}
                ></button>
              </div>
              <div className="participant-settings-popup">
                <h6
                  style={{
                    padding: '0',
                    margin: '0',
                    justifyContent: 'center',
                    borderBottom: '1px solid gray',
                    marginBottom: '10px',
                  }}
                >
                  {selectedUser.get('firstName')} {selectedUser.get('lastName')}
                </h6>
                {userMenuOptions.map((option, index) => (
                  <>
                    {option.show() && (
                      <button
                        key={index}
                        onClick={() => option.onClick(selectedUser)}
                      >
                        <h5>{option.buttonName}</h5>
                      </button>
                    )}
                  </>
                ))}
              </div>
            </>
          )}
        </IonPage>
      )}
      {addingUser && (
        <AddContactsToGroup
          alreadyParticipants={props.conv?.get('participants')}
          cancelAddingUser={cancelAddingUser}
          convId={convId}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: any) => ({
  conv: state.conversation,
  notification: state.notification,
  onlineList: state.onlineList,
});

export default connect(mapStateToProps)(ChatInfo);
