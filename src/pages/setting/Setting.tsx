import { IonContent, IonIcon, IonPage } from '@ionic/react';
import SettingHeader from 'src/components/Header/SettingHeader';
import UserCard from 'src/components/setting/UserCard';

// images and icons
import StarredMessage from 'src/assets/icon/starred-message.png';
import SharedMedia from 'src/assets/icon/shared-media.png';
import Notifications from 'src/assets/icon/notifications.png';
import Privacy from 'src/assets/icon/privacy.png';

import 'src/assets/sass/messagenius/pages/setting/Setting.scss';

import { chevronForwardOutline } from 'ionicons/icons';

import { useHistory } from 'react-router-dom';
import NotificationPopUp from 'src/components/notification/NotificationPopUp';
import { connect } from 'react-redux';

interface RProps {
  notification: any;
}

const Setting: React.FC<RProps> = ({ notification }) => {
  const history = useHistory();
  return (
    <IonPage>
      <NotificationPopUp notification={notification} />
      <SettingHeader />
      <IonContent className="setting-container">
        <div onClick={() => history.push('/profile')}>
          <UserCard />
        </div>
        <div className="divider" />
        <div className="card-style"></div>
        <div className="card-style">
          <div className="card-content-style">
            <img src={StarredMessage} alt="..." className="icon-style" />
            <div className="card-text-style">Starred Message</div>
          </div>
          <IonIcon slot="icon-only" icon={chevronForwardOutline} />
        </div>
        <div className="card-style">
          <div className="card-content-style">
            <img src={SharedMedia} alt="..." className="icon-style" />
            <div className="card-text-style">Shared Media</div>
          </div>
          <IonIcon slot="icon-only" icon={chevronForwardOutline} />
        </div>
        <div className="card-style"></div>
        <div className="card-style">
          <div className="card-content-style">
            <img src={Notifications} alt="..." className="icon-style" />
            <div className="card-text-style">Notifications and Sounds</div>
          </div>
          <IonIcon slot="icon-only" icon={chevronForwardOutline} />
        </div>
        <div className="card-style">
          <div className="card-content-style">
            <img src={Privacy} alt="..." className="icon-style" />
            <div className="card-text-style">Privacy and Security</div>
          </div>
          <IonIcon slot="icon-only" icon={chevronForwardOutline} />
        </div>
      </IonContent>
    </IonPage>
  );
};

const mapStateToProps = (state: any) => ({
  notification: state.notification,
});
export default connect(mapStateToProps)(Setting);
