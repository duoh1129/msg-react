import { IonIcon } from '@ionic/react';
import {
  checkmarkDoneOutline,
  checkmarkOutline,
  pencil,
  pencilOutline,
  pencilSharp,
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import QuotedMessage from './quotedMessage/QuotedMessage';
import Hammer from 'react-hammerjs';
import LinkPreview from './linkPreview/LinkPreview';

interface MProps {
  isSingle: boolean | undefined;
  isFromMe: boolean;
  received: boolean;
  selected?: boolean;
  showingInfo?: boolean;
  atLeastOneSelectedMessage?: boolean;
  read: boolean;
  edited: boolean;
  msgHour: string;
  msgMinute: string;
  senderName: string;
  msg: any;
  toggleSelectedMessage?: any;
  quotedMessage?: Parse.Object<Parse.Attributes>;
  setReplyingToMessage?: any;
  urlPreview?: string;
}

const TextMessage: React.FC<MProps> = ({
  isSingle,
  isFromMe,
  received,
  read,
  edited,
  atLeastOneSelectedMessage,
  msgHour,
  msgMinute,
  senderName,
  msg,
  toggleSelectedMessage,
  selected,
  showingInfo,
  quotedMessage,
  setReplyingToMessage,
  urlPreview,
}) => {
  const [moveX, setMoveX] = useState(0);
  let textContainerStyle = isFromMe
    ? {
        marginRight: `${Math.abs(moveX * 2)}px`,
      }
    : {
        marginLeft: `${Math.abs(moveX * 2)}px`,
      };
  useEffect(() => {
    if (Math.abs(moveX) > 35 && !showingInfo) {
      setReplyingToMessage(msg);
      setMoveX(0);
    }
  }, [moveX]);
  return (
    <>
      <div
        className={`${isFromMe ? 'own-msg' : 'diff-msg'} msg ${
          selected && 'selected'
        }`}
        style={textContainerStyle}
      >
        <Hammer
          onPress={() => {
            if (!showingInfo && !selected && !atLeastOneSelectedMessage) {
              toggleSelectedMessage(msg);
            }
          }}
          onTap={() => {
            if (!showingInfo && atLeastOneSelectedMessage) {
              toggleSelectedMessage(msg);
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
          <div style={{ position: 'relative' }}>
            {urlPreview && (
              <div className="link-preview-textmessage">
                <LinkPreview view="message" url={urlPreview} />
              </div>
            )}
            <div>
              {!isFromMe && !isSingle && (
                <div
                  style={{
                    marginLeft: '-10px',
                    marginTop: '-5px',
                  }}
                  className="sender-name"
                >
                  {senderName}
                </div>
              )}
              {quotedMessage && (
                <div>
                  <QuotedMessage message={quotedMessage} />
                </div>
              )}
              {msg.get('text')}{' '}
              {edited && (
                <IonIcon
                  style={{
                    color: 'black',
                    fontSize: '12px',
                  }}
                  icon={pencilOutline}
                />
              )}
              <div className="info-msg">
                {`${msgHour}:${msgMinute}`}{' '}
                {isFromMe && (
                  <>
                    {!received && !read && <IonIcon icon={checkmarkOutline} />}
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
          </div>
        </Hammer>
      </div>
    </>
  );
};

export default TextMessage;
