import { Avatar } from '@material-ui/core';
import React from 'react';
import Parse from 'parse';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';

import 'src/assets/sass/messagenius/components/chatInfo/ParticipantCard.scss';

interface Props {
  participantObj?: Parse.Object<Parse.Attributes>;
  admin?: boolean;
}

const ParticipantCard: React.FC<Props> = ({ participantObj, admin }) => {
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor(
      `${participantObj?.get('firstName')} ${participantObj?.get('lastName')}`
    )}`, //function from functions/cards
  };
  return (
    <>
      <div className="participant-card">
        <div className="participant-avatar">
          <Avatar
            className="contacts-avatar"
            src={participantObj?.get('avatar')?._url}
            style={avatarStyle}
          >
            {participantObj?.get('firstName')?.charAt(0)?.toUpperCase()}
            {participantObj
              ?.get('lastName')
              ?.split(' ')[0]
              ?.charAt(0)
              .toUpperCase()}
            {participantObj
              ?.get('lastName')
              ?.split(' ')[1]
              ?.charAt(0)
              .toUpperCase()}
          </Avatar>
        </div>
        <div className="participant-name">
          {participantObj == Parse.User.current() ? (
            <h5>You</h5>
          ) : (
            <h5>{`${participantObj?.get('firstName')} ${participantObj?.get(
              'lastName'
            )}`}</h5>
          )}
        </div>
        {admin && (
          <div className="admin-title">
            <h6>Admin</h6>
          </div>
        )}
      </div>
    </>
  );
};

export default ParticipantCard;
