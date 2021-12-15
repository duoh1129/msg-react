import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Parse from 'parse';
import { IonIcon, IonItem } from '@ionic/react';
import {
  ban,
  checkmarkOutline,
  checkmarkDoneOutline,
  flag,
  mic,
  micOutline,
  notificationsOff,
  image,
  videocam,
  people,
  location,
  attach,
  eyeOutline,
  lockClosedOutline,
} from 'ionicons/icons';

import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import { getLastMsgDate } from 'src/functions/cards/getLastMsgDate';
import { Avatar } from '@material-ui/core';

import 'src/assets/sass/messagenius/components/ChatList/ChatCard/ChatCard.scss';
import { connect } from 'react-redux';
import VoiceRecorder from '../chat/voiceRecorder/VoiceRecorder';
export interface Props {
  parseObj: Parse.Object<Parse.Attributes>;
  participants: any;
  muted: boolean;
  flagged: boolean;
  deleted: boolean;
  received: boolean;
  read: boolean;
  opened: boolean;
  onlineContacts: any;
  isSingle: boolean;
  isSelected: boolean;
}

// if from = user.current: don't show anything, else show 'from'

const ChatCard: React.FunctionComponent<Props> = ({
  participants,
  parseObj,
  muted,
  flagged,
  deleted,
  received,
  read,
  opened,
  onlineContacts,
  isSingle,
  isSelected,
}: Props) => {
  //useStates
  const [senderName, setSenderName] = useState<String>(''); //who sent the msg
  const [participantIds, setParticipantIds] = useState<any>([]);
  const [onlineInChat, setOnlineInChat] = useState<number>(0);

  //useHistory
  let history = useHistory();

  //constants
  let sentByMe: boolean | undefined =
    Parse.User.current()?.id == (parseObj?.get && parseObj?.get('lastMessage')?.get('from')?.id)
      ? true
      : false;

  if (parseObj?.get && parseObj?.get('lastMessage')?.get('from')?.id == undefined) {
    sentByMe = undefined;
  }

  //avatar color
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor( parseObj?.get && parseObj.get('title'))}`, //function from functions/cards
  };

  let receiptStyle = {
    color: '#0087FF',
  };

  useEffect(() => {
    //get sender name
    const getSenderName = async () => {
      if (!sentByMe) {
        if (sentByMe != undefined) {
          // lastMessage from is defined
          let lastMessageSender = parseObj?.get && parseObj?.get('lastMessage')?.get('from');
          if (lastMessageSender?.get) {
            setSenderName(lastMessageSender.get('firstName'));
          } else {
            // query for the user
            const User = Parse.Object.extend('_User'); //user obj
            const queryuser: any = new Parse.Query<
              Parse.Object<Parse.Attributes>
            >(User); //user query
            queryuser.equalTo('objectId', lastMessageSender?.id); //equal to who sent this msg
            await queryuser
              .first()
              .then((res: Parse.Object<Parse.Attributes>) => {
                setSenderName(res?.get('firstName'));
              });
          }
        }
      }
    };
    getSenderName();
  });

  useEffect(() => {
    if (participants?.length > 0) {
      for (const user of participants) {
        if (user.id != Parse.User.current()?.id)
          setParticipantIds((participantIds: any) => [
            ...participantIds,
            user.id,
          ]);
      }
    }
  }, [participants]);

  useEffect(() => {
    onlineContacts?.filter((value: any) => participantIds?.includes(value))
      ?.length > 0
      ? setOnlineInChat(
          onlineContacts?.filter((value: any) =>
            participantIds?.includes(value)
          )?.length
        )
      : setOnlineInChat(0);
  }, [participantIds, onlineContacts]);

  const openChatWithUser = () => {
    history.push(`/chat/${parseObj.id}`);
  };

  return (
    <IonItem
      lines="none"
      detail={false}
      button
      onClick={() => {
        if (!isSelected) {
          openChatWithUser();
        }
      }}
    >
      <div className={`chat-card-container ${isSelected && 'selected'}`}>
        <div className="avatar-area">
          {isSingle ? (
            <div className="online-circle-single-chatlist">
              {onlineInChat > 0 && <div className="isOnline"></div>}
            </div>
          ) : (
            <div className="online-circle-group-chatlist">
              {onlineInChat > 0 && (
                <div className="isOnline">{onlineInChat}</div>
              )}
            </div>
          )}
          <Avatar
            className="contacts-avatar"
            src={parseObj.get && parseObj.get('avatar')?._url}
            style={avatarStyle}
          >
            {parseObj.get && parseObj.get('title').split(' ')[0].charAt(0).toUpperCase()}
            {parseObj.get && parseObj.get('title').split(' ')[1]?.charAt(0).toUpperCase()}
            {parseObj.get && parseObj.get('title').split(' ')[2]?.charAt(0).toUpperCase()}
          </Avatar>
          <div id="flagged">
            {flagged === true ? (
              <IonIcon slot="icon-only" className="icon-style" icon={flag} />
            ) : (
              <></>
            )}
          </div>
          <div id="muted">
            {muted === true ? (
              <IonIcon
                slot="icon-only"
                className="icon-style"
                icon={notificationsOff}
              />
            ) : (
              <></>
            )}
          </div>
          <div id="muted"></div>
        </div>
        <div className="content-area">
          <div className="name-area">
            <div className="name-style">
              {parseObj.get && parseObj.get('title')}
              {parseObj.get && parseObj.get('isSecret') && (
                <IonIcon
                  className="icon-secret-chat"
                  icon={lockClosedOutline}
                />
              )}
            </div>
            <div className="time-style">{`${getLastMsgDate(parseObj)}`}</div>
          </div>
          <div className="message-area">
            {deleted ? (
              <div className="deleted-area">
                <IonIcon slot="icon-only" className="icon-style" icon={ban} />
                <div className="delete-text">This message has been deleted</div>
              </div>
            ) : (
              <div className="message-content-area">
                <div className="message-content-text">
                  {parseObj.get && !parseObj.get('isSecret') && sentByMe && (
                    <>
                      {opened && (
                        <IonIcon
                          style={{ color: '#0087FF' }}
                          icon={eyeOutline}
                        />
                      )}{' '}
                      {!received &&
                        !read &&
                        parseObj.get && parseObj.get('lastMessage') != undefined && (
                          <IonIcon icon={checkmarkOutline} />
                        )}
                      {received && !read && (
                        <IonIcon icon={checkmarkDoneOutline} />
                      )}
                      {read && (
                        <IonIcon
                          style={{ color: '#0087FF' }}
                          icon={checkmarkDoneOutline}
                        />
                      )}
                    </>
                  )}
                  {parseObj.get && !parseObj.get('isSecret') && (
                    <>
                      {!sentByMe &&
                        sentByMe != undefined &&
                        parseObj.get && parseObj.get('type') != 0 && <>{senderName}: </>}
                      {sentByMe == undefined &&
                        parseObj.get && parseObj?.get('lastMessage')?.get('from') !=
                          undefined && <>No messages yet</>}
                      {/* type == 0 or default: text message, no icon
                  type == 1: voice message, microphone icon
                  type == 2: message with image, picture icon
                  type == 3: message with video, video icon
                  type == 4: message with contact, profile icon
                  type == 5: message with location, map pin icon
                  type == 6: message with file, attachment icon
                  */}
                      {parseObj.get && parseObj.get('lastMessage')?.get('type') === 0 ? (
                        <>
                          {`${parseObj
                            .get('lastMessage')
                            ?.get('text')
                            ?.substring(0, 15)}${
                              parseObj.get && parseObj.get('lastMessage')?.get('text')?.length >
                            15
                              ? '...'
                              : ''
                          }`}
                        </>
                      ) : (
                        <></>
                      )}
                      {parseObj.get && parseObj.get('lastMessage')?.get('type') === 1 ? (
                        <>
                          <IonIcon
                            slot="icon-only"
                            className="icon-style"
                            icon={mic}
                          />
                          {parseObj.get && parseObj.get('duration')}&nbsp;
                        </>
                      ) : (
                        <></>
                      )}
                      {parseObj.get && parseObj.get('lastMessage')?.get('type') === 2 ? (
                        <>
                          <IonIcon
                            slot="icon-only"
                            className="icon-style"
                            icon={image}
                          />
                          Picture
                        </>
                      ) : (
                        <></>
                      )}
                      {parseObj.get && parseObj.get('lastMessage')?.get('type') === 3 ? (
                        <>
                          <IonIcon
                            slot="icon-only"
                            className="icon-style"
                            icon={videocam}
                          />
                          {parseObj.get && parseObj.get('duration')}&nbsp;
                        </>
                      ) : (
                        <></>
                      )}
                      {parseObj.get && parseObj.get('lastMessage')?.get('type') === 4 ? (
                        <IonIcon
                          slot="icon-only"
                          className="icon-style"
                          icon={people}
                        />
                      ) : (
                        <></>
                      )}
                      {parseObj.get && parseObj.get('lastMessage')?.get('type') === 5 ? (
                        <IonIcon
                          slot="icon-only"
                          className="icon-style"
                          icon={location}
                        />
                      ) : (
                        <></>
                      )}
                      {parseObj.get && parseObj.get('lastMessage')?.get('type') === 6 ? (
                        <IonIcon
                          slot="icon-only"
                          className="icon-style"
                          icon={attach}
                        />
                      ) : (
                        <></>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="record-area">
        <VoiceRecorder convId={parseObj?.id} />
      </div>
    </IonItem>
  );
};

const mapStateToProps = (state: any) => ({
  onlineContacts: state.onlineList,
});

export default connect(mapStateToProps)(ChatCard);
