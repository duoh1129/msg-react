import React from 'react';
import { IonButton, IonButtons, IonIcon } from '@ionic/react';
// images
import 'src/assets/sass/messagenius/components/Setting/UserCard.scss';
import { chevronForwardOutline } from 'ionicons/icons';

import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import { Avatar } from '@material-ui/core';
import Parse from 'parse';
import { connect } from 'react-redux';

interface UserCardProps {
  user: Parse.Object<Parse.Attributes>;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor(
      `${Parse.User.current()?.get('firstName')} ${Parse.User.current()?.get(
        'lastName'
      )}`
    )}`,
  };
  return (
    <>
      <div className="setting-user-card-container">
        <div className="avatar-area">
          <Avatar
            style={avatarStyle}
            src={user?.get('avatar')?.get('thumb')?._url}
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
          <div className="name-area">
            <div className="fullname-style">{`${Parse.User.current()?.get(
              'firstName'
            )} ${Parse.User.current()?.get('lastName')}`}</div>
            <div className="name-style">
              @{Parse.User.current()?.get('username')}
            </div>
          </div>
        </div>
        <IonIcon slot="icon-only" icon={chevronForwardOutline} />
      </div>
    </>
  );
};

const mapStateToProps = (state: any) => ({
  user: state.user,
});

export default connect(mapStateToProps)(UserCard);
