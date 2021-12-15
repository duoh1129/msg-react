import React from 'react';
import 'src/assets/sass/messagenius/pages/contacts/Contacts.scss';
import Parse from 'parse';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import Avatar from '@material-ui/core/Avatar';

export interface Props {
  data: Parse.Object<Parse.Attributes>;
}

const ContactsGroupCard: React.FunctionComponent<Props> = ({ data }: Props) => {
  //avatar color
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor(
      `${data.get('firstName')} ${data.get('lastName')}`
    )}`, //function from functions/cards
  };

  return (
    <div className="contacts-card">
      <Avatar
        className="contacts-avatar"
        src={data.get('avatar')?._url}
        style={avatarStyle}
      >
        {data.get('firstName').charAt(0).toUpperCase()}
        {data.get('lastName').split(' ')[0].charAt(0).toUpperCase()}
        {data.get('lastName').split(' ')[1]?.charAt(0).toUpperCase()}
      </Avatar>
      <div className="contacts-name-area">
        <div className="contacts-name">
          {`${data.get('firstName')} ${data.get('lastName')}`}
        </div>
        <div className="contacts-subscript">
          {data.get('cat1')?.get('name')}-{data.get('department')?.get('name')}-
          {data.get('profile')?.get('jobTitle')}
        </div>
      </div>
    </div>
  );
};

export default ContactsGroupCard;
