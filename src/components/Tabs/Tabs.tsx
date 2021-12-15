import {
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
} from '@ionic/react';
// icons and images
import icTabChat from 'src/assets/icon/ic_tab_chat.svg';
import icTabChatActive from 'src/assets/icon/ic_tab_chat_active.svg';
import icTabContacts from 'src/assets/icon/ic_tab_contacts.svg';
import icTabContactsActive from 'src/assets/icon/ic_tab_contacts_active.svg';
import icTabSettings from 'src/assets/icon/ic_tab_settings.svg';
import icTabSettingsActive from 'src/assets/icon/ic_tab_settings_active.svg';

import ChatList from 'src/pages/chat/ChatList';
import Contacts from 'src/pages/contacts/Contacts';
import Setting from 'src/pages/setting/Setting';

import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import 'src/assets/sass/messagenius/components/Tabs/Tabs.scss';

const Tabs = (props: any) => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/tabs/chat/list" component={ChatList} exact={true} />
        <Route path="/tabs/contacts" component={Contacts} exact={true} />
        <Route path="/tabs/settings" component={Setting} exact={true} />
        <Route
          path="/tabs"
          render={() => <Redirect to="/tabs/chat/list" />}
          exact={true}
        />
      </IonRouterOutlet>
      <IonTabBar slot="bottom" className="footer-tabs-area">
        <IonTabButton tab="chat" href="/tabs/chat/list">
          <img
            src={
              props.location.pathname === '/tabs/chat/list'
                ? icTabChatActive
                : icTabChat
            }
            className="footer-icon-style"
          />
        </IonTabButton>
        <IonTabButton tab="contacts" href="/tabs/contacts">
          <img
            src={
              props.location.pathname === '/tabs/contacts'
                ? icTabContactsActive
                : icTabContacts
            }
            className="footer-icon-style"
          />
        </IonTabButton>
        <IonTabButton tab="settings" href="/tabs/settings">
          <img
            src={
              props.location.pathname === '/tabs/settings'
                ? icTabSettingsActive
                : icTabSettings
            }
            className="footer-icon-style"
          />
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};
export default Tabs;
