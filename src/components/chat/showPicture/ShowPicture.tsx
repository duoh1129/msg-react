import { IonIcon } from '@ionic/react';
import { closeOutline, sendOutline } from 'ionicons/icons';
import React from 'react';

interface SProps {
  closePicture: any;
  pictureToShow: any;
  showSendPictureButton: boolean;
  sendChosenPicture: any;
}

const ShowPicture: React.FC<SProps> = ({
  closePicture,
  pictureToShow,
  sendChosenPicture,
  showSendPictureButton,
}) => {
  return (
    <div className="show-picture-container">
      <div className="show-picture-header">
        <div className="close-picture-button">
          <button onClick={closePicture}>
            <IonIcon className="show-picture-close-icon" icon={closeOutline} />
          </button>
        </div>
        <div className="show-picture-info">
          <h4>{pictureToShow?.name}</h4>
          <h6>{pictureToShow?.date}</h6>
        </div>
      </div>
      <img
        className="show-picture-img"
        src={pictureToShow?.imageUrl}
        alt=",,,"
      />
      {showSendPictureButton && (
        <div className="show-picture-footer">
          <button className="send-picture-button" onClick={sendChosenPicture}>
            <IonIcon className="show-picture-send-icon" icon={sendOutline} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShowPicture;
