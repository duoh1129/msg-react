import { IonIcon } from '@ionic/react';
import {
  arrowUndo,
  cameraOutline,
  closeOutline,
  documentOutline,
  micOutline,
} from 'ionicons/icons';
import Parse from 'parse';
import 'src/assets/sass/messagenius/components/chat/messageToReplyTo/MessageToReplyTo.scss';
interface MProps {
  message: Parse.Object<Parse.Attributes> | undefined;
  cancelReplyingToMessage: any;
}

const MessageToReplyTo: React.FC<MProps> = ({
  message,
  cancelReplyingToMessage,
}) => {
  return (
    <div className="message-to-reply-to-container">
      <div className="message-to-reply-to-message">
        <div className="message-to-reply-to-message-from">
          <IonIcon
            icon={arrowUndo}
            className="message-to-reply-to-reply-icon"
          />
          {` ${message?.get('from').get('firstName')} ${message
            ?.get('from')
            .get('lastName')}`}
        </div>
        <div className="message-to-reply-to-message-content">
          {message?.get('type') == 0 && <>{message?.get('text')}</>}
          {message?.get('type') == 1 && (
            <>
              <IonIcon
                className="message-to-reply-to-attachment-icon"
                icon={micOutline}
              />{' '}
              Voice message
            </>
          )}
          {message?.get('type') == 2 && (
            <>
              <IonIcon
                className="message-to-reply-to-attachment-icon"
                icon={cameraOutline}
              />{' '}
              Picture
            </>
          )}
          {message?.get('type') == 6 && (
            <>
              <IonIcon
                className="message-to-reply-to-attachment-icon"
                icon={documentOutline}
              />{' '}
              File
            </>
          )}
        </div>
      </div>
      <IonIcon
        onClick={cancelReplyingToMessage}
        icon={closeOutline}
        className="message-to-reply-to-icon"
      />
    </div>
  );
};

export default MessageToReplyTo;
