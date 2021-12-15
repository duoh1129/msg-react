import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  image,
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import 'src/assets/sass/messagenius/components/notification/NotificationPopUp.scss';
import { sendMessage } from 'src/functions/chat/sendMessage';
import store from 'src/services/redux/store';
import Parse from 'parse';

interface NotificationProps {
  notification: any;
}

export const NotificationPopUp: React.FC<NotificationProps> = ({
  notification,
}) => {
  const history = useHistory();

  const [replyingToNotification, setReplyingToNotification] = useState(true);
  const [messageToSend, setMessageToSend] = useState('');

  const clearNotification = async () => {
    store.dispatch({
      type: 'setNotification',
      value: {},
    });
    store.dispatch({
      type: 'setReplyingToNotification',
      value: false,
    });
    setReplyingToNotification(false);
    setMessageToSend('');
  };

  useEffect(() => {
    let timeout: any;
    timeout = setTimeout(() => {
      clearNotification();
    }, 3000);

    const clearTimeoutFunction = () => {
      clearTimeout(timeout);
    };

    //@ts-ignore
    useEffect.clearTimeoutFunction = clearTimeoutFunction;
  }, [notification?.text]);

  const replyToNotification = async () => {
    setReplyingToNotification(true);
    store.dispatch({
      type: 'setReplyingToNotification',
      value: true,
    });
    setTimeout(
      () => document.getElementById('notification-input')?.click(),
      350
    );
  };

  return (
    <>
      {!replyingToNotification ? (
        <div>
          <div
            className={
              notification?.convId != undefined
                ? `notification-container active`
                : `notification-container`
            }
          >
            <button
              onClick={() => {
                history.push(`/chat/${notification?.convId}`);
                clearNotification();
              }}
            >
              <div className="notification-title-container">
                <div className="notification-title">
                  {notification?.convTitle}
                </div>{' '}
                - now
              </div>
              <div className="notification-body">
                <div className="notification-from">
                  {notification?.convType == 1 && `${notification?.from}: `}
                </div>
                {/* Text message */}
                {notification?.messageType == 0 ? (
                  <>
                    <div className="notification-text">
                      {notification?.text}
                    </div>
                  </>
                ) : (
                  <></>
                )}
                {/* Image message */}
                {notification?.messageType == 2 ? (
                  <>
                    <div className="notification-image">
                      <IonIcon icon={image} />{' '}
                      <div style={{ marginLeft: '5px' }}>Picture</div>
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </div>
            </button>
            <div className="notification-buttons">
              <div className="notification-button">
                <button
                  onClick={() => {
                    //@ts-ignore
                    useEffect.clearTimeoutFunction();
                    replyToNotification();
                  }}
                >
                  Reply
                </button>
              </div>
              {/* <div className="notification-button">Mark as read</div> */}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={
            notification?.convId != undefined
              ? `notification-container active`
              : `notification-container`
          }
        >
          <div>
            <div className="notification-text replying">
              <b>{notification?.from}</b>: {notification?.text}
            </div>
            <div className="notification-textinput">
              <input
                className="notification-input"
                id="notification-input"
                type="text"
                onChange={(e: any) => {
                  setMessageToSend(e.target.value);
                }}
              />
              <div className="notification-reply-buttons">
                <IonIcon
                  className="chatinfo-grouptitle-action-icon"
                  icon={checkmarkCircleOutline}
                  style={{ paddingRight: '2px' }}
                  onClick={() => {
                    sendMessage(
                      Parse.User.current()?.id,
                      notification?.convId,
                      {
                        text: messageToSend,
                      },
                      undefined
                    );
                    clearNotification();
                  }}
                />
                <IonIcon
                  className="chatinfo-grouptitle-action-icon"
                  icon={closeCircleOutline}
                  onClick={clearNotification}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPopUp;
