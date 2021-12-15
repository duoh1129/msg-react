import React from 'react';
import Parse from 'parse';
import { Avatar } from '@material-ui/core';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import 'src/assets/sass/messagenius/components/CreateGroup/ContactsGroupAvatar.scss';

interface CardProps {
  ParseObj: Parse.Object<Parse.Attributes>;
}
const ContactsGroupAvatar: React.FC<CardProps> = ({ ParseObj }) => {
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor(
      `${ParseObj.get('firstName')} ${ParseObj.get('lastName')}`
    )}`, //function from functions/cards
  };
  return (
    <div className="contactsgroupavatar">
      <div className="contactsgroup-avatar">
        <Avatar src={ParseObj.get('avatar')?._url} style={avatarStyle}>
          {ParseObj.get('firstName').charAt(0).toUpperCase()}
          {ParseObj.get('lastName').split(' ')[0].charAt(0).toUpperCase()}
          {ParseObj.get('lastName').split(' ')[1]?.charAt(0).toUpperCase()}
        </Avatar>
      </div>
      <div className="contactsgroup-name">{ParseObj.get('firstName')}</div>
    </div>
  );
};

export default ContactsGroupAvatar;
