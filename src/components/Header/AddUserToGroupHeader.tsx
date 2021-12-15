import {
  IonButton,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { arrowBack, arrowForward } from 'ionicons/icons';
import React from 'react';
import { useHistory } from 'react-router';

interface AProps {
  selected: any;
  hideArrowForward: boolean;
  cancel: any;
  addContactsToGroup: any;
}

const AddUserToGroupHeader: React.FC<AProps> = ({
  selected,
  hideArrowForward,
  cancel,
  addContactsToGroup,
}) => {
  return (
    <IonHeader className="ion-no-border">
      <IonToolbar className="contacts-header-toolbar-area">
        <div className="creategroup-header">
          <div className="creategroup-backward">
            <IonIcon
              slot="start"
              icon={arrowBack}
              className="icon back-button"
              onClick={() => {
                cancel();
              }}
            />
          </div>
          <div className="creategroup-header-title">Select contacts</div>
          <div className="creategroup-forward">
            {selected?.length > 0 && !hideArrowForward ? (
              <IonIcon
                icon={arrowForward}
                onClick={() => {
                  addContactsToGroup();
                }}
                className="icon back-button"
              />
            ) : (
              <></>
            )}
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default AddUserToGroupHeader;
