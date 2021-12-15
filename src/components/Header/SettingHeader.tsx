import { IonHeader, IonToolbar, IonTitle } from '@ionic/react';

const SettingHeader: React.FC = () => {
  return (
    <IonHeader className="ion-no-border">
      <IonToolbar className="setting-header-toolbar-area">
        <IonTitle className="setting-header-title">Settings</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
};

export default SettingHeader;
