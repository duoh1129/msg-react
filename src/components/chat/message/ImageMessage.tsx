import { IonIcon } from '@ionic/react';
import {
  checkmarkDoneOutline,
  checkmarkOutline,
  eyeOutline,
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import Parse from 'parse';
import Hammer from 'react-hammerjs';
import QuotedMessage from './quotedMessage/QuotedMessage';

interface MProps {
  isSingle: boolean | undefined;
  isFromMe: boolean;
  received: boolean;
  selected?: boolean;
  read: boolean;
  opened: boolean;
  showingInfo?: boolean;
  atLeastOneSelectedMessage?: boolean;
  msgHour: string;
  msgMinute: string;
  senderName: string;
  msg: any;
  showClickedPicture?: any;
  toggleSelectedMessage?: any;
  setReplyingToMessage?: any;
  quotedMessage?: Parse.Object<Parse.Attributes> | undefined;
}

const ImageMessage: React.FC<MProps> = ({
  isSingle,
  isFromMe,
  received,
  read,
  opened,
  atLeastOneSelectedMessage,
  msgHour,
  msgMinute,
  senderName,
  msg,
  showClickedPicture,
  selected,
  toggleSelectedMessage,
  showingInfo,
  setReplyingToMessage,
  quotedMessage,
}) => {
  const [moveX, setMoveX] = useState(0);
  let containerStyle = isFromMe
    ? {
        marginRight: `${Math.abs(moveX * 2)}px`,
      }
    : {
        marginLeft: `${Math.abs(moveX * 2)}px`,
      };
  useEffect(() => {
    if (Math.abs(moveX) > 35) {
      setReplyingToMessage(msg);
      setMoveX(0);
    }
  }, [moveX]);
  return (
    <>
      {isSingle ? (
        <>
          <Hammer
            onPress={() => {
              if (!showingInfo && !selected && !atLeastOneSelectedMessage) {
                toggleSelectedMessage(msg);
              }
            }}
            onTap={(e) => {
              if (!showingInfo && atLeastOneSelectedMessage) {
                e.srcEvent.stopPropagation();
                // adding a 10ms timeout so that it won't open the picture (selectedmessages = 0 will happen after the click is registered by the button to open the picture)
                setTimeout(() => {
                  toggleSelectedMessage(msg);
                }, 10);
              }
            }}
            onPan={(e) => {
              if (Math.abs(e.deltaX) < 45 && !showingInfo) {
                setMoveX(e.deltaX);
              } else {
                setMoveX(0);
              }
            }}
            direction={'DIRECTION_HORIZONTAL'}
          >
            <div
              className={`${isFromMe ? 'own-msg' : 'diff-msg'} img-msg ${
                quotedMessage && 'hasQuoted'
              }`}
              style={containerStyle}
            >
              <>
                {quotedMessage && <QuotedMessage message={quotedMessage} />}
                <button
                  style={{ width: '100%', height: '100%' }}
                  onClick={(e) => {
                    if (!showingInfo && !atLeastOneSelectedMessage) {
                      e.stopPropagation();
                      showClickedPicture(msg);
                    }
                  }}
                >
                  <img
                    className={`${selected && 'selected'}`}
                    src={msg.get('attachment')?.get('thumb')?._url}
                  />
                  <div className="info-msg">
                    {`${msgHour}:${msgMinute}`}{' '}
                    {isFromMe && (
                      <>
                        {' '}
                        {opened && (
                          <IonIcon
                            style={{ color: '#0087FF' }}
                            icon={eyeOutline}
                          />
                        )}{' '}
                        {!received && !read && (
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
                  </div>
                </button>
              </>
            </div>
          </Hammer>
        </>
      ) : (
        <>
          <Hammer
            onPress={() => {
              if (!showingInfo && !selected && !atLeastOneSelectedMessage) {
                toggleSelectedMessage(msg);
              }
            }}
            onTap={(e) => {
              if (!showingInfo && atLeastOneSelectedMessage) {
                e.srcEvent.stopPropagation();
                // adding a 10ms timeout so that it won't open the picture (selectedmessages = 0 will happen after the click is registered by the button to open the picture)
                setTimeout(() => {
                  toggleSelectedMessage(msg);
                }, 10);
              }
            }}
            onPan={(e) => {
              if (Math.abs(e.deltaX) < 45 && !showingInfo) {
                setMoveX(e.deltaX);
              } else {
                setMoveX(0);
              }
            }}
            direction={'DIRECTION_HORIZONTAL'}
          >
            <div
              style={{
                alignSelf: isFromMe ? 'flex-end' : 'flex-start',
              }}
              className="img-group-container"
            >
              <>
                {quotedMessage && <QuotedMessage message={quotedMessage} />}
                <button
                  style={{ width: '100%', height: '100%' }}
                  onClick={(e) => {
                    if (!showingInfo && !atLeastOneSelectedMessage) {
                      e.stopPropagation();
                      showClickedPicture(msg);
                    }
                  }}
                >
                  {!isFromMe && (
                    <div className="sender-name-img">{senderName}</div>
                  )}
                  <div
                    className={`${isFromMe ? 'own-msg' : 'diff-msg'} img-msg ${
                      quotedMessage && 'hasQuoted'
                    }`}
                  >
                    <img
                      className={`${selected && 'selected'}`}
                      src={msg.get('attachment')?.get('thumb')?._url}
                    />
                    <div className="info-msg">
                      {`${msg.get('createdAt')?.getHours()}:${msg
                        .get('createdAt')
                        ?.getMinutes()}`}{' '}
                      {isFromMe && (
                        <>
                          {!received && !read && (
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
                    </div>
                  </div>
                </button>
              </>
            </div>
          </Hammer>
        </>
      )}
    </>
  );
};

export default ImageMessage;
