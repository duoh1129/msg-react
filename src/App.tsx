import React, { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { connect, Provider } from 'react-redux';
import store from './services/redux/store';
import Parse from 'parse';
import { liveQueryChatList } from './functions/chatList/liveQueryChatList';
import { liveQueryContacts } from './functions/contacts/liveQueryContacts';
import {
  startNetworkStatusListener,
  stopNetworkStatusListener,
} from './functions/connection/connectionStatusUpdater';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import 'src/assets/sass/messagenius.scss';

/* Theme variables */
import './theme/variables.css';

import Login from './pages/auth/Login';
import Tabs from 'src/components/Tabs/Tabs';
import Profile from './pages/profile/Profile';
import CreateGroup from 'src/pages/createGroup/CreateGroup';
import Chat from './pages/chat/Chat';
import ChatInfo from './pages/chat/ChatInfo';
import { liveQueryCurrentUser } from './functions/currentUser/liveQueryCurrentUser';
import { liveQueryMessages } from './functions/chat/liveQueryMessages';
import { getOnlineContacts } from './functions/contacts/getOnlineContacts';
import { Network } from '@capacitor/network';
import { liveQueryChatInfo } from './functions/chatList/liveQueryChatInfo';

interface AppProps {
  userId?: string;
}
interface RProps {
  component: React.FC<any>;
  exact?: boolean;
  path: string;
}

const AppWithStore: React.FC = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

//Private route (if not authenticated redirect to /login)
const PrivateRoute = ({
  component: Component,

  ...rest
}: RProps) => (
  <Route
    {...rest}
    render={(props) =>
      Parse?.User?.current() !== null ? (
        <Component {...props} />
      ) : (
        <Redirect to={{ pathname: '/login' }} />
      )
    }
  />
);

//Public route (if authenticated redirect to /tabs since redirecting to / would cause a loop)
const PublicRoute = ({
  component: Component,

  ...rest
}: RProps) => (
  <Route
    {...rest}
    render={(props) =>
      Parse?.User?.current() === null ? (
        <Component {...props} />
      ) : (
        <Redirect to={{ pathname: '/tabs' }} />
      )
    }
  />
);

let App: React.FC<AppProps> = () => {
  //Parse server connection
  useEffect(() => {
    Parse.serverURL = 'https://api-ionic.messagenius.dev:443/v3'; // Server URL
    Parse.initialize(
      'messagenius' // Application ID
    );
  }, []);

  //if user has an active session
  useEffect(() => {
    if (Parse?.User?.current() !== null) {
      //query user full details and put it into redux
      const queryUser = async () => {
        let q = new Parse.Query('_User');
        await q
          .equalTo('objectId', Parse.User.current())
          .include('profile')
          .include('department')
          .include('avatar')
          .first()
          .then((res: any) =>
            store.dispatch({
              type: 'setUser',
              value: res,
            })
          );
      };
      queryUser();

      //redux stuff
      store.dispatch({
        type: 'setUserId',
        value: Parse?.User?.current()?.id,
      });
      store.dispatch({
        type: 'setUserName',
        value: Parse?.User?.current()?.get('username'),
      });
    }
  });

  //redux init
  useEffect(() => {
    store.dispatch({
      type: 'clearOnlineList',
    });
    store.dispatch({
      type: 'setReplyingToNotification',
      value: false,
    });
    getOnlineContacts();
  });

  //live queries
  useEffect(() => {
    if (Parse.User.current()?.id !== undefined) {
      liveQueryChatList();
      liveQueryContacts();
      liveQueryCurrentUser();
      liveQueryMessages();
      liveQueryChatInfo();
    }
    return () => {};
  }, []);

  // network status listener
  useEffect(() => {
    startNetworkStatusListener();
    return () => {
      stopNetworkStatusListener();
    };
  });

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
          <Route exact path="/chat">
            <Redirect to="/tabs/chat/list" />
          </Route>
          <PublicRoute path="/login" component={Login} />
          <PrivateRoute path="/tabs" component={Tabs} />
          <PrivateRoute path="/profile" component={Profile} />
          <Route path="/newgroup" component={CreateGroup} exact={true} />
          <PrivateRoute
            path="/chat/:conversationId/info"
            component={ChatInfo}
            exact={true}
          />
          <PrivateRoute
            path="/chat/:conversationId"
            component={Chat}
            exact={true}
          />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

//Get Redux state
const mapStateToProps = (state: any) => ({});

App = connect(mapStateToProps)(App);
export default AppWithStore;
