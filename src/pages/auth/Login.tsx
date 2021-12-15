import {
  IonContent,
  IonPage,
  IonImg,
  IonIcon,
  IonGrid,
  IonRow,
  IonInput,
  IonButton,
} from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import LogoBackImg from 'src/assets/image/login-img.png';
import LogoImg from 'src/assets/icon/Messagenius-logo.svg';
import UserAccount from 'src/assets/icon/ic_user.svg';
import Password from 'src/assets/icon/ic_password.svg';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import store from '../../services/redux/store';
import Parse from 'parse';
import { logOut } from 'src/functions/auth/Logout';

const Login: React.FC = () => {
  const [errMsg, setErrMsg] = useState(''); //TODO add something to visualize this on login page
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const history = useHistory();
  const handleGetInformation = () => {
    alert('You clicked information button');
  };
  const handleLogin = async (e: any) => {
    //Do not reload
    e.preventDefault();
    //Parse server Login
    Parse.User.logIn(email, pass)
      .then((user) => {
        // Store in Redux after successful login
        store.dispatch({
          type: 'setUserId',
          value: user.id,
        });
        store.dispatch({
          type: 'setUserName',
          value: user.get('username'),
        });
        store.dispatch({
          type: 'setUser',
          value: user,
        });
        history.replace('tabs');
      })
      .catch((error) => {
        //Get error and store in errMsg state
        const err = JSON.parse(JSON.stringify(error));
        if (err === 209) {
          store.dispatch({
            type: 'logOut',
          });
          logOut();
        }
        setErrMsg(err.message);
      });
  };
  return (
    <IonPage>
      <IonContent className="login-body">
        <IonImg src={LogoBackImg} />
        <IonIcon
          className="login-information-icon"
          icon={alertCircleOutline}
          onClick={() => handleGetInformation()}
        />
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonImg src={LogoImg} className="login-logo-style" />
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <div className="login-input-area">
              <IonInput
                value={email}
                placeholder="Email"
                className="login-input-style"
                onIonChange={(e) => setEmail(e.detail.value!)}
                clearInput
              >
                <IonIcon icon={UserAccount} className="login-input-icon" />
              </IonInput>
              <IonInput
                value={pass}
                type="password"
                placeholder="Password"
                className="login-input-style"
                onIonChange={(e) => setPass(e.detail.value!)}
                clearInput
              >
                <IonIcon icon={Password} className="login-input-icon" />
              </IonInput>
            </div>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <IonButton className="login-button" onClick={(e) => handleLogin(e)}>
              LOGIN
            </IonButton>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <div className="login-text-style">Forgot Password</div>
          </IonRow>
        </IonGrid>
        <div className="login-terms-area">
          <IonRow className="ion-justify-content-center">
            <IonImg src={LogoImg} className="login-terms-logo-style" />
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <div className="login-text-style">Terms and Conditions</div>
          </IonRow>
        </div>
      </IonContent>
    </IonPage>
  );
};

const mapStateToProps = (state: any) => ({});

export default connect(mapStateToProps)(Login);
