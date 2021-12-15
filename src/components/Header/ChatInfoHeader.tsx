import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import Parse from 'parse';
import { useHistory } from 'react-router-dom';
import { arrowBack, optionsOutline, searchOutline } from 'ionicons/icons';
import 'src/assets/sass/messagenius/components/Header/ChatHeader.scss';
import 'src/assets/sass/messagenius/components/chatInfo/ChatInfoHeader.scss';
import { useState } from 'react';
import { preProcessFile } from 'typescript';

interface SettingsList {
  name?: string;
  onlyGroup?: boolean;
  onClick?: any;
}

const ChatInfoHeader = (props: any) => {
  let history = useHistory();

  let settings = [
    {
      onlyGroup: true,
      name: 'Leave Group',
      onClick: (e: CustomEvent) => {
        leaveGroup();
        e?.stopPropagation();
        setSettingsOpen(false);
      },
    },
    {
      onlyGroup: true,
      name: 'Add contacts',
      onClick: () => {
        props.addUser();
      },
    },
  ];

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const leaveGroup = async () => {
    await Parse.Cloud.run('leaveGroup', {
      conversationId: props.convId,
    }).then(() => {
      history.replace('/tabs/chat/list');
    });
  };

  return (
    <IonHeader className="ion-no-border">
      <IonToolbar className="header-toolbar-area">
        <IonIcon
          slot="start"
          icon={arrowBack}
          className="icon back-button"
          onClick={() => history.replace(`/chat/${props.convId}`)}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h2>{props.isSingle ? 'Contact' : 'Group'} Info</h2>
        </div>
        <IonButtons slot="end">
          <IonButton onClick={() => setSettingsOpen(!settingsOpen)}>
            <IonIcon icon={optionsOutline} className="rotate icon" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
      {settingsOpen && (
        <>
          <div className="chat-settings-container">
            <button
              onClick={() => {
                setSettingsOpen(false);
              }}
            ></button>
          </div>
          <div className="chat-settings-popup">
            {settings.map((setting: SettingsList, index) => {
              if ((props.isSingle && !setting.onlyGroup) || !props.isSingle) {
                return (
                  <button key={index} onClick={setting.onClick}>
                    <h5>{setting.name}</h5>
                  </button>
                );
              }
            })}
          </div>
        </>
      )}
    </IonHeader>
  );
};

export default ChatInfoHeader;
