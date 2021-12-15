import {
  IonContent,
  IonIcon,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonTextarea,
} from '@ionic/react';

import Parse from 'parse';

import {
  cameraOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  closeCircleOutline,
  closeOutline,
  createOutline,
  happyOutline,
  imageOutline,
} from 'ionicons/icons';

import { useHistory } from 'react-router-dom';

import 'src/assets/sass/messagenius/pages/profile/Profile.scss';
import { Avatar, CircularProgress } from '@material-ui/core';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import { useEffect, useState } from 'react';
import { logOut } from 'src/functions/auth/Logout';
import { connect } from 'react-redux';
import { useTakePicture } from 'src/functions/chat/hooks/useTakePicture';
import NotificationPopUp from 'src/components/notification/NotificationPopUp';

interface ProfileProps {
  user: Parse.Object<Parse.Attributes>;
  notification: any;
}

const Profile: React.FC<ProfileProps> = ({ user, notification }) => {
  const history = useHistory();
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor(
      `${Parse.User.current()?.get('firstName')} ${Parse.User.current()?.get(
        'lastName'
      )}`
    )}`,
  };

  //custom hooks
  const { takePhoto } = useTakePicture(); //takePhoto hook

  //show selection (camera or gallery)
  const [
    showChangeProfilePictureSelection,
    setShowChangeProfilePictureSelection,
  ] = useState(false);
  const [showPicture, setShowPicture] = useState(false);
  const [showSendPictureButton, setShowSendPictureButton] = useState(false);
  const [showLoadingPicture, setShowLoadingPicture] = useState<boolean>(false);
  const [chosenPicture, setChosenPicture] = useState<any>(undefined);
  const [pictureToShow, setPictureToShow] = useState<any>({});
  const [userProfile, setUserProfile] = useState<
    Parse.Object<Parse.Attributes> | undefined
  >(undefined);
  const [editingUserInfo, setEditingUserInfo] = useState(false);
  const [info, setInfo] = useState(undefined);

  useEffect(() => {
    const getUserProfile = async () => {
      let queryProfile = new Parse.Query('Profile').equalTo('user', {
        __type: 'Pointer',
        className: '_User',
        objectId: Parse.User.current()?.id,
      });
      await queryProfile.first().then((res) => {
        setUserProfile(res);
      });
    };
    getUserProfile();
  }, []);

  const handleDoneEditingProfile = async () => {
    //code to edit server
    history.replace('/tabs/settings');
  };

  //write changes to db
  const setProfilePicture = async (file: Parse.File) => {
    setShowLoadingPicture(true);
    setShowPicture(false);
    setShowSendPictureButton(false);
    await user
      .get('avatar')
      .set('file', file)
      .save()
      .then(() => {
        setChosenPicture(undefined);
        setPictureToShow(undefined);
        setTimeout(() => setShowLoadingPicture(false), 300);
      });
  };

  //take pic from the camera
  const takeCameraPicture = async () => {
    setShowChangeProfilePictureSelection(false);
    await takePhoto().then((res: any) => {
      let parseFile = new Parse.File(res.filepath, {
        base64: res.base64 || '',
      });
      setProfilePicture(parseFile);
    });
  };

  //handle chosen picture (from gallery)
  const handleChosenPicture = (e: any) => {
    setShowChangeProfilePictureSelection(false);
    setShowPicture(true);
    setShowSendPictureButton(true);
    setChosenPicture(e.target.files[0]);
    setPictureToShow({ imageUrl: URL.createObjectURL(e.target.files[0]) });
  };

  //close picture
  const closePicture = () => {
    //here you should remove the event listener
    setShowSendPictureButton(false);
    setShowPicture(false);
    setPictureToShow(undefined);
    setChosenPicture(undefined);
  };

  const saveUserInfo = async () => {
    setEditingUserInfo(false);
    if (userProfile) {
      // set profile
      userProfile?.set('notes', info);
      await userProfile?.save();
    } else {
      // create a profile
      let profileObj = new Parse.Object('Profile');
      profileObj.set('user', {
        __type: 'Pointer',
        className: '_User',
        objectId: Parse.User.current()?.id,
      });
      profileObj.set('notes', info);
      await profileObj.save().then((userProfile) => {
        setUserProfile(userProfile);
      });
    }
  };

  return (
    <IonPage>
      <NotificationPopUp notification={notification} />
      <IonHeader className="ion-no-border profile-header-container">
        <IonToolbar className="profile-header-toolbar-area">
          <div className="profile-header">
            <div className="profile-header-title header-title">
              Edit Profile
            </div>
            <div className="profile-header-title profile-header-title-green">
              <button onClick={handleDoneEditingProfile}>Done</button>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="profile-container">
        <div className="profile-container">
          <div className="avatar-area">
            <button
              className="profile-view-picture"
              onClick={() => {
                setShowPicture(true);
                setPictureToShow({
                  imageUrl: user?.get('avatar')?.get('file')?._url,
                });
              }}
            ></button>
            <Avatar
              style={avatarStyle}
              src={user?.get('avatar')?.get('file')?._url}
              className="avatar-style"
            >
              {Parse.User.current()
                ?.get('firstName')
                .split(' ')[0]
                .charAt(0)
                .toUpperCase()}
              {Parse.User.current()
                ?.get('lastName')
                .split(' ')[0]
                ?.charAt(0)
                .toUpperCase()}
              {Parse.User.current()
                ?.get('lastName')
                .split(' ')[1]
                ?.charAt(0)
                .toUpperCase()}
            </Avatar>
            <div className="profile-picture-loading">
              {showLoadingPicture && <CircularProgress />}
            </div>
            <div className="profile-avatar-text">
              <button
                onClick={() => {
                  setShowChangeProfilePictureSelection(true);
                }}
              >
                Change profile picture
              </button>
            </div>
          </div>
          <div className="item-area">
            <div className="item-gray-text">USER INFO</div>
          </div>
          <div className="item-area">
            <div className="item-title">Name</div>
            <div className="item-text">{`${Parse.User.current()?.get(
              'firstName'
            )} ${Parse.User.current()?.get('lastName')}`}</div>
          </div>
          <div className="item-area">
            <div className="item-title">Username</div>
            <div className="item-text">
              @{Parse.User.current()?.get('username')}
            </div>
          </div>
          <div className="item-area">
            <div className="item-gray-text">STATUS</div>
          </div>
          <div className="item-area">
            {!editingUserInfo ? (
              <div className="item-text">
                <div className="profile-notes-item item-text">
                  {userProfile?.get('notes') || 'No user info'}
                </div>
                <button
                  style={{ padding: 0, margin: 0 }}
                  onClick={() => setEditingUserInfo(true)}
                >
                  <IonIcon
                    style={{ color: 'gray' }}
                    className="edit-title-icon"
                    icon={createOutline}
                  ></IonIcon>
                </button>
              </div>
            ) : (
              <div className="profile-input-container">
                <IonTextarea
                  autoGrow
                  spellCheck
                  maxlength={150}
                  rows={3}
                  className="profile-input"
                  value={info ?? userProfile?.get('notes')}
                  onIonChange={(e: any) => setInfo(e.detail?.value)}
                />
                <div className="profile-input-action-icons">
                  <IonIcon
                    className="profile-input-action-icon"
                    icon={checkmarkCircleOutline}
                    onClick={() => saveUserInfo()}
                  />
                  <IonIcon
                    className="profile-input-action-icon"
                    icon={closeCircleOutline}
                    onClick={() => {
                      setInfo(undefined);
                      setEditingUserInfo(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="item-area">
            <div className="item-gray-text">COMPANY INFO</div>
          </div>
          <div className="item-area">
            <div className="item-title">Department: </div>
            <div className="item-text">
              {user?.get('department')?.get('name') || 'No department info'}
            </div>
          </div>
          <div className="item-area">
            <div className="item-title">Job title: </div>
            <div className="item-text">
              {user?.get('profile')?.get('jobTitle') || 'No job info'}
            </div>
          </div>
          <div className="item-area">
            <div className="item-title">Email: {''}</div>
            <div className="item-cyan-text">
              {Parse.User.current()?.get('email')}
            </div>
          </div>
        </div>
        <div className="logout-container">
          <button onClick={() => logOut()} className="logout-button">
            LOGOUT
          </button>
        </div>
      </IonContent>
      {/* change profile picture selection (source) */}
      {showChangeProfilePictureSelection && (
        <div className="picture-source-selection">
          <button
            className="exit-picture-selection"
            onClick={() => setShowChangeProfilePictureSelection(false)}
          ></button>
          <div className="picture-selection-container">
            <button className="icon_button" onClick={takeCameraPicture}>
              <IonIcon icon={cameraOutline} className="attachment-icon" />
              <h4>Take a picture</h4>
            </button>
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
              <h4>Choose from gallery</h4>
            </button>
          </div>
        </div>
      )}
      {showPicture && (
        <div className="show-picture-container">
          <div className="show-picture-header">
            <div className="close-picture-button">
              <button onClick={closePicture}>
                <IonIcon
                  className="show-picture-close-icon"
                  icon={closeOutline}
                />
              </button>
            </div>
          </div>
          <img
            className="show-picture-img"
            src={pictureToShow?.imageUrl}
            alt=",,,"
          />
          {showSendPictureButton && (
            <div className="show-picture-footer">
              <button
                className="send-picture-button"
                onClick={() => {
                  let parseFile = new Parse.File(
                    chosenPicture?.name,
                    chosenPicture
                  );
                  setProfilePicture(parseFile);
                }}
              >
                <IonIcon
                  className="show-picture-confirm-icon"
                  icon={checkmarkOutline}
                />
              </button>
            </div>
          )}
        </div>
      )}
    </IonPage>
  );
};

const mapStateToProps = (state: any) => ({
  user: state.user,
  notification: state.notification,
});
export default connect(mapStateToProps)(Profile);
