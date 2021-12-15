import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import {
  addOutline,
  archiveOutline,
  chatbubblesOutline,
  trashBinOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const buttonNoStyle: CSSProperties = {
  all: 'unset',
};

interface HProps {
  showingArchivedChats: boolean;
  toggleShowArchivedChats: any;
  numberOfSelectedChats: number;
  archiveChats: any;
  deleteChats: any;
}

const Header: React.FC<HProps> = ({
  showingArchivedChats,
  toggleShowArchivedChats,
  numberOfSelectedChats,
  archiveChats,
  deleteChats,
}) => {
  let history = useHistory();
  return (
    <>
      {numberOfSelectedChats == 0 && (
        <IonHeader className="ion-no-border">
          <IonToolbar className="header-toolbar-area">
            <IonTitle slot="start" className="header-title">
              Chat
            </IonTitle>
            <IonButtons slot="end">
              <IonButton
                style={buttonNoStyle}
                onClick={() => toggleShowArchivedChats()}
              >
                <IonIcon
                  className="header-icon"
                  slot="icon-only"
                  icon={
                    showingArchivedChats ? chatbubblesOutline : archiveOutline
                  }
                />{' '}
              </IonButton>
              <IonButton
                style={buttonNoStyle}
                onClick={() => history.replace('/tabs/contacts')}
              >
                <IonIcon
                  className="header-icon"
                  slot="icon-only"
                  icon={addOutline}
                />{' '}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
      )}
      {numberOfSelectedChats > 0 && (
        <>
          <IonHeader className="ion-no-border">
            <IonToolbar className="header-toolbar-area">
              <IonTitle slot="start" className="header-title">
                {numberOfSelectedChats} selected
              </IonTitle>
              <IonButtons slot="end">
                <IonButton style={buttonNoStyle} onClick={archiveChats}>
                  <IonIcon
                    slot="icon-only"
                    className="header-icon"
                    icon={archiveOutline}
                  ></IonIcon>
                </IonButton>{' '}
                <IonButton style={buttonNoStyle} onClick={deleteChats}>
                  <IonIcon
                    slot="icon-only"
                    className="header-icon"
                    icon={trashBinOutline}
                  ></IonIcon>
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
        </>
      )}
    </>
  );
};

export default Header;
