import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import Parse from 'parse';
import { checkmarkDoneOutline, closeOutline } from 'ionicons/icons';
import 'src/assets/sass/messagenius/pages/chat/MessageInfo.scss';
import VoiceMessage from 'src/components/chat/message/VoiceMessage';
import ImageMessage from 'src/components/chat/message/ImageMessage';
import FileMessage from 'src/components/chat/message/FileMessage';
import TextMessage from 'src/components/chat/message/TextMessage';
import { getMessageInfoDate } from 'src/functions/chat/getMessageInfoDate';
import MessageInfoCard from 'src/components/messageInfo/MessageInfoCard';

interface MProps {
  msg?: Parse.Object<Parse.Attributes> | undefined;
  closeMessageInfo: any;
  isSingle?: boolean;
}

const MessageInfo: React.FC<MProps> = ({ msg, isSingle, closeMessageInfo }) => {
  const [messageInfos, setMessageInfos] = useState<any>([]);

  //get message time
  let msgTime = msg?.get('createdAt');
  let msgHour = msgTime.getHours();
  let msgMinute =
    msgTime.getMinutes() < 10
      ? `0${msgTime.getMinutes()}`
      : msgTime.getMinutes();

  let received = msg?.get('received');
  let read = msg?.get('read');
  let opened = msg?.get('opened');
  let edited = msg?.get('editHistory') != undefined;

  useEffect(() => {
    const queryMessageInfos = async () => {
      // query for all MessageInfos about this message
      let queryMessageInfo = new Parse.Query('MessageInfo').equalTo('message', {
        __type: 'Pointer',
        className: 'Message',
        objectId: msg?.id,
      });

      if (isSingle) {
        // if it's single then get only the first (which is also the only one)
        let messageInfo = await queryMessageInfo.first();
        setMessageInfos([messageInfo]);
      } else {
        //include the recipients (to show account info)
        queryMessageInfo.include('recipient');
        let messageInfos = await queryMessageInfo.find();
        setMessageInfos([...messageInfos]);
      }
    };
    queryMessageInfos();
  }, [msg]);

  return (
    <IonPage className="messageinfo-container">
      <IonHeader className="ion-no-border">
        <IonToolbar className="messageinfo-header-toolbar-area">
          <IonIcon
            slot="start"
            icon={closeOutline}
            className="icon back-button"
            onClick={() => {
              closeMessageInfo();
            }}
          />
          <IonTitle text-center>Message Info</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="messageinfo-message-container">
          <div className="messageinfo-message">
            <React.Fragment>
              {/* type == 0 or default: text message, no icon
                  type == 1: voice message, microphone icon
                  type == 2: message with image, picture icon
                  type == 3: message with video, video icon
                  type == 4: message with contact, profile icon
                  type == 5: message with location, map pin icon
                  type == 6: message with file, attachment icon
                */}

              {msg?.get('type') == 0 && msg?.get('from') && (
                <TextMessage
                  isSingle={isSingle}
                  isFromMe={true}
                  received={received}
                  read={read}
                  edited={edited}
                  msgHour={msgHour}
                  msgMinute={msgMinute}
                  senderName={''}
                  msg={msg}
                  showingInfo={true}
                />
              )}
              {/* audio msg? */}
              {msg?.get('type') == 1 && (
                <VoiceMessage
                  isSingle={isSingle}
                  received={received}
                  read={read}
                  opened={opened}
                  isFromMe={true}
                  msgHour={msgHour}
                  msgMinute={msgMinute}
                  senderName={''}
                  msg={msg}
                  showingInfo={true}
                />
              )}
              {/* image msg? */}
              {msg?.get('type') == 2 && (
                <ImageMessage
                  isSingle={isSingle}
                  received={received}
                  read={read}
                  opened={opened}
                  isFromMe={true}
                  msgHour={msgHour}
                  msgMinute={msgMinute}
                  senderName={''}
                  msg={msg}
                  showingInfo={true}
                />
              )}
              {msg?.get('type') == 6 && (
                <FileMessage
                  msg={msg}
                  parseFileName={msg?.get('attachment')?.get('file')?._name}
                  parseFileURL={msg?.get('attachment')?.get('file')?._url}
                  fileExtension={
                    msg?.get('attachment')?.get('file')?._name?.split('.')[
                      msg?.get('attachment')?.get('file')?._name?.split('.')
                        ?.length - 1
                    ]
                  }
                  senderName={''}
                  msgHour={msgHour}
                  msgMinute={msgMinute}
                  isSingle={isSingle}
                  isFromMe={true}
                  received={received}
                  read={read}
                  opened={opened}
                  showingInfo={true}
                />
              )}
            </React.Fragment>
          </div>
        </div>
        <div className="messageinfo-users-info">
          {isSingle ? (
            <>
              <div className="messageinfo-singlechat-read">
                <IonIcon
                  style={{ color: ' #0087FF', paddingRight: '5px' }}
                  icon={checkmarkDoneOutline}
                />
                <h4>
                  Read: {getMessageInfoDate(messageInfos[0]?.get('readAt'))}
                </h4>
              </div>
              <div className="messageinfo-singlechat-received">
                <IonIcon
                  style={{ paddingRight: '5px' }}
                  icon={checkmarkDoneOutline}
                />{' '}
                <h4>
                  Received:{' '}
                  {getMessageInfoDate(messageInfos[0]?.get('receivedAt'))}
                </h4>
              </div>
            </>
          ) : (
            <>
              <div className="messageinfo-groupchat-read">
                <div style={{ display: 'flex', paddingBottom: '10px' }}>
                  <IonIcon
                    style={{ color: ' #0087FF', paddingRight: '5px' }}
                    icon={checkmarkDoneOutline}
                  />
                  <h4>Read by:</h4>
                </div>
                <div className="messageinfo-groupchat-read-users">
                  {messageInfos.map((info: any, index: number) => {
                    if (info.get('readAt') != undefined) {
                      return (
                        <MessageInfoCard
                          key={index}
                          time={info.get('readAt')}
                          user={info.get('recipient')}
                        />
                      );
                    }
                  })}
                </div>
              </div>
              <div className="messageinfo-groupchat-received">
                <div style={{ display: 'flex', paddingBottom: '10px' }}>
                  <IonIcon
                    style={{ paddingRight: '5px' }}
                    icon={checkmarkDoneOutline}
                  />

                  <h4>Received by:</h4>
                </div>

                <div className="messageinfo-groupchat-received-users">
                  {messageInfos.map((info: any, index: number) => {
                    if (info.get('receivedAt') != undefined) {
                      return (
                        <>
                          <MessageInfoCard
                            key={index}
                            time={info.get('receivedAt')}
                            user={info.get('recipient')}
                          />
                        </>
                      );
                    }
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MessageInfo;
