import { IonIcon } from '@ionic/react';
import {
  calendarOutline,
  cameraOutline,
  closeOutline,
  documentOutline,
  imageOutline,
  sendOutline,
} from 'ionicons/icons';
import React, { useState } from 'react';
import { useTakePicture } from 'src/functions/chat/hooks/useTakePicture';
import { sendMessage } from 'src/functions/chat/sendMessage';
import Parse from 'parse';

import 'src/assets/sass/messagenius/components/chat/addAttachment/addAttachment.scss';

interface AProps {
  handleClickAddAttachment: any;
  handleChosenPicture: any;
  setShowAddAttachment: any;
  convId: string;
  messageToReplyTo: any;
  setReplyingToMessage: any;
  scheduleMessage: any;
}

const AddAttachment: React.FC<AProps> = ({
  handleClickAddAttachment,
  handleChosenPicture,
  setShowAddAttachment,
  convId,
  messageToReplyTo,
  setReplyingToMessage,
  scheduleMessage
}) => {
  //custom hooks
  const { takePhoto } = useTakePicture(); //takePhoto hook
  const [documentToSend, setDocumentToSend] = useState<any>(undefined);

  const takeCameraPicture = async () => {
    setShowAddAttachment(false);
    await takePhoto().then((res) => {
      let parseFile = new Parse.File(res.filepath, {
        base64: res.base64 || '',
      });
      let messageToSend = { image: parseFile };
      sendMessage(
        Parse.User.current()?.id,
        convId,
        messageToSend,
        messageToReplyTo
      );
      setReplyingToMessage(undefined);
    });
  };

  const sendDocument = async () => {
    let parseFile = new Parse.File(documentToSend.name, documentToSend);
    let messageToSend = { file: parseFile };
    setDocumentToSend(undefined);
    setShowAddAttachment(false);
    let res = await sendMessage(
      Parse.User.current()?.id,
      convId,
      messageToSend,
      messageToReplyTo
    );
    setReplyingToMessage(undefined);
    let documentParseName = res.attachmentParseName;
    //here we need to save the document on the directory externalData
  };

  const previewDocument = (e: any) => {
    e.preventDefault();
    setDocumentToSend(e.target.files[0]);
  };

  const cancelDocumentSend = () => {
    setShowAddAttachment(false);
    setDocumentToSend(undefined);
  };

  return (
    <>
      <div className="add-attachment-container">
        <button
          onClick={() => {
            handleClickAddAttachment();
          }}
        ></button>
      </div>
      <div className="add-attachment">
        <div className="attachment">
          <button className="icon_button" onClick={takeCameraPicture}>
            <IonIcon icon={cameraOutline} className="attachment-icon" />
            <h4>Camera</h4>
          </button>
        </div>
        <div className="attachment">
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
            <h4>Gallery</h4>
          </button>
        </div>
        <div className="attachment">
          <button
            className="icon_button"
            onClick={() => {
              document.getElementById('document-input')?.click();
            }}
          >
            <IonIcon icon={documentOutline} className="attachment-icon" />
            <input
              id="document-input"
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => previewDocument(e)}
            />
            <h4>File</h4>
          </button>
        </div>
        <div className="attachment">
          <button
            className="icon_button"
            onClick={() => {
              scheduleMessage()
            }}
          >
            <IonIcon icon={calendarOutline} className="attachment-icon" />
            <h4>Scheduled</h4>
            <h4>message</h4>
          </button>
        </div>
      </div>
      {documentToSend != undefined && (
        <div className="document-confirmation-container">
          <div className="show-document-header">
            <div className="close-document-button">
              <button onClick={cancelDocumentSend}>
                <IonIcon
                  className="show-document-close-icon"
                  icon={closeOutline}
                />
              </button>
            </div>
          </div>
          <div className="show-document-icon-container">
            <div className="show-document-icon">
              <IonIcon icon={documentOutline} />
              <h3 className="show-document-extension">
                {documentToSend.name
                  .split('.')
                  [documentToSend.name.split('.').length - 1].toUpperCase()}
              </h3>
            </div>
            <div className="show-document-icon-name">
              <h4>{documentToSend.name.split('.')[0]}</h4>
            </div>
          </div>
          <div className="show-document-footer">
            <button className="send-document-button" onClick={sendDocument}>
              <IonIcon className="show-document-send-icon" icon={sendOutline} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddAttachment;
