import { IonIcon } from '@ionic/react';
import { arrowUndo, documentOutline, micOutline } from 'ionicons/icons';
import Parse from 'parse';
import 'src/assets/sass/messagenius/components/chat/message/QuotedMessage.scss';

interface QProps {
  message: Parse.Object<Parse.Attributes>;
}

const QuotedMessage: React.FC<QProps> = ({ message }) => {
  return (
    <div className="quoted-message-container">
      {message.get('type') == 0 && (
        <div className="quoted-message-text-type">
          <div className="quoted-message-from">
            {`${message.get('from').get('firstName')} ${message
              .get('from')
              .get('lastName')}`}
            <IonIcon className="quoted-message-quote-icon" icon={arrowUndo} />
          </div>
          <div className="quoted-message-content">
            <div className="quoted-message-text">{message.get('text')}</div>
          </div>
        </div>
      )}
      {message.get('type') == 1 && (
        <div className="quoted-message-audio-type">
          <div className="quoted-message-from">
            {`${message.get('from').get('firstName')} ${message
              .get('from')
              .get('lastName')}`}
            <IonIcon className="quoted-message-quote-icon" icon={arrowUndo} />
          </div>
          <div className="quoted-message-content">
            <IonIcon
              className="quoted-message-attachment-icon"
              icon={micOutline}
            />{' '}
            Voice message
          </div>
        </div>
      )}
      {message.get('type') == 2 && (
        <div className="quoted-message-img-type">
          <img
            className="quoted-message-attachment-img"
            src={message.get('attachment')?.get('thumb')?._url}
          />
          <div className="quoted-message-img-content">
            <div className="quoted-message-from">
              {`${message.get('from').get('firstName')} ${message
                .get('from')
                .get('lastName')}`}
              <IonIcon className="quoted-message-quote-icon" icon={arrowUndo} />
            </div>
            <div className="quoted-message-img-text">{message.get('text')}</div>
          </div>
        </div>
      )}
      {message.get('type') == 6 && (
        <div className="quoted-message-file-type">
          <div className="quoted-message-from">
            {`${message.get('from').get('firstName')} ${message
              .get('from')
              .get('lastName')}`}
            <IonIcon className="quoted-message-quote-icon" icon={arrowUndo} />
          </div>
          <div className="quoted-message-content">
            <IonIcon
              className="quoted-message-attachment-icon"
              icon={documentOutline}
            />{' '}
            <div className="quoted-message-attachment-text">
              {message
                .get('attachment')
                ?.get('file')
                ?._name?.substr(
                  message.get('attachment')?.get('file')?._name?.indexOf('_') +
                    1
                )
                .substr(0, 30)}
              {/* show dots */}
              {message
                .get('attachment')
                ?.get('file')
                ?._name?.substr(
                  message.get('attachment')?.get('file')?._name?.indexOf('_') +
                    1
                )[31] && '...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotedMessage;
