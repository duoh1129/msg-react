import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Avatar } from '@material-ui/core';
import {
  arrowBack,
  arrowForwardOutline,
  arrowRedoOutline,
  arrowUndoOutline,
  closeOutline,
  createOutline,
  informationCircleOutline,
  lockClosedOutline,
  optionsOutline,
  pencilOutline,
  searchOutline,
  trashBinOutline,
} from 'ionicons/icons';
import 'src/assets/sass/messagenius/components/Header/ChatHeader.scss';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import { connect } from 'react-redux';
import Parse from 'parse';
import { useEffect, useRef, useState } from 'react';

interface CHProps {
  id: string;
  name: string;
  avatarUrl: string;
  onlineList?: any;
  conversationParticipants?: any;
  convType?: any;
  isSecret?: boolean;
  isClosed?: boolean;
  selectedMessages: Parse.Object<Parse.Attributes>[];
  clearSelectedMessages: any;
  showDeleteMessagesMenu: any;
  editMessage: any;
  setInfoMessage: any;
  setReplyingToMessage: any;
  forwardMessages: any;
  openScheduledMessagesList: any
}

const ChatHeader: React.FC<CHProps> = (props) => {
  let history = useHistory();
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor(props.name || 'XFSEASD')}`, //function from functions/cards
  };

  const chatOptions = [
    {
      show: () => {
        if (props.isSecret && !props.isClosed) {
          return true;
        } else return false;
      },
      name: 'Close chat',
      onClick: () => {
        Parse.Cloud.run('closeSecretChat', { convId: props.id });
      },
    },
    {
      show: () => {
        if (!props.isSecret) {
          return true;
        } else return false;
      },
      name: 'Delete chat',
      onClick: () => {
        localStorage.removeItem(`_cached_messages_${props.id}`);
        history.replace('/tabs/chat/list');
        Parse.Cloud.run('deleteConversationForMe', { convId: props.id });
      },
    },
    {
      show: () => {
        if (!props.isSecret) {
          return true;
        } else return false;
      },
      name: 'Scheduled Messages',
      onClick: () => {
        props.openScheduledMessagesList();
      },
    },
  ];

  let otherUser: any;
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [chatOptionsOpen, setChatOptionsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (props.convType == 0) {
      otherUser = props.conversationParticipants[1];
      let isOnline = props.onlineList?.includes(otherUser?.id);
      setIsOnline(isOnline);
    }
  }, [props.convType, props.conversationParticipants, props.onlineList]);

  return (
    <>
      {props.selectedMessages.length == 0 ? (
        <>
          <IonHeader className="ion-no-border">
            <IonToolbar className="header-toolbar-area chatheader-toolbar-area">
              <IonIcon
                slot="start"
                icon={arrowBack}
                className="icon back-button"
                onClick={() => history.replace('/tabs/chat/list')}
              />

              <button
                style={{
                  outlineStyle: 'none',
                  background: 'transparent',
                  display: 'flex',
                  textAlign: 'left',
                  alignItems: 'center',
                }}
                onClick={() => history.push(`/chat/${props.id}/info`)}
              >
                <div className="user-info-container">
                  <Avatar
                    className="avatar"
                    style={avatarStyle}
                    src={props.avatarUrl}
                  >
                    {props.name?.split(' ')[0].charAt(0).toUpperCase()}
                    {props.name?.split(' ')[1]?.charAt(0).toUpperCase()}
                    {props.name?.split(' ')[2]?.charAt(0).toUpperCase()}
                  </Avatar>
                  {isOnline && props.convType == 0 && (
                    <div className="isOnline"></div>
                  )}
                  <div className="user-info-content">
                    <h2 className="user-info-name">
                      {props.name}{' '}
                      {props.isSecret && (
                        <IonIcon
                          className="secret-chat-icon"
                          icon={lockClosedOutline}
                        />
                      )}
                    </h2>
                    <p className="user-info-status"></p>
                  </div>
                </div>
              </button>
              <IonButtons slot="end">
                <IonButton className="icon">
                  <IonIcon icon={searchOutline} className="icon" />
                </IonButton>
                <IonButton
                  onClick={() => {
                    setChatOptionsOpen(true);
                  }}
                >
                  <IonIcon icon={optionsOutline} className="rotate icon" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          {chatOptionsOpen && (
            <>
              <div className="chat-options-container">
                <button
                  onClick={() => {
                    setChatOptionsOpen(false);
                  }}
                  className="chat-options-background-button"
                ></button>
                <div className="chat-options-popup">
                  {chatOptions.map((option, index) => {
                    return (
                      <>
                        {option.show() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatOptionsOpen(false);
                              option.onClick();
                            }}
                            key={index}
                            className="chat-option"
                          >
                            <h5>{option.name}</h5>
                          </button>
                        )}
                      </>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <IonHeader className="ion-no-border">
          <IonToolbar className="header-toolbar-area">
            <IonIcon
              slot="start"
              icon={closeOutline}
              className="icon back-button"
              onClick={props.clearSelectedMessages}
            />
            <IonTitle>
              <h4>{`${props.selectedMessages.length}`}</h4>
            </IonTitle>
            <IonButtons slot="end" className="header-selected-messages-button">
              {props.selectedMessages?.length === 1 && !props.isClosed && (
                <IonButton
                  onClick={() => {
                    props.setReplyingToMessage({
                      message: props.selectedMessages[0],
                    });
                  }}
                  className="icon"
                >
                  <IonIcon icon={arrowUndoOutline} className="icon" />
                </IonButton>
              )}

              {!props.isClosed && (
                <IonButton
                  onClick={() => {
                    props.showDeleteMessagesMenu();
                  }}
                  className="icon"
                >
                  <IonIcon icon={trashBinOutline} className="icon" />
                </IonButton>
              )}

              {/* show the edit button if only one text message is selected and it's from me */}
              {!props.isClosed &&
                props.selectedMessages?.length === 1 &&
                props.selectedMessages[0].get('type') == 0 &&
                props.selectedMessages[0].get('from').id ==
                  Parse.User.current()?.id && (
                  <IonButton
                    onClick={() => {
                      props.editMessage(props.selectedMessages[0]);
                    }}
                    className="icon"
                  >
                    <IonIcon icon={createOutline} className="icon" />
                  </IonButton>
                )}
              {!props.isClosed && (
                <IonButton
                  onClick={() => {
                    props.forwardMessages();
                  }}
                  className="icon"
                >
                  <IonIcon icon={arrowRedoOutline} className="icon" />
                </IonButton>
              )}
              {props.selectedMessages?.length === 1 &&
                props.selectedMessages[0].get('from').id ==
                  Parse.User.current()?.id && (
                  <IonButton
                    onClick={() => {
                      props.setInfoMessage();
                    }}
                    className="icon"
                  >
                    <IonIcon icon={informationCircleOutline} className="icon" />
                  </IonButton>
                )}
            </IonButtons>
          </IonToolbar>
        </IonHeader>
      )}
    </>
  );
};

const MapStateToProps = (state: any) => ({
  onlineList: state.onlineList,
});

export default connect(MapStateToProps)(ChatHeader);
