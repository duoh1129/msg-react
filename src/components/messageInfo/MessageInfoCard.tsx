import { IonItem } from '@ionic/react';
import { Avatar } from '@material-ui/core';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import 'src/assets/sass/messagenius/components/messageInfo/MessageInfoCard.scss';
import { getMessageInfoDate } from 'src/functions/chat/getMessageInfoDate';

interface MProps {
  user: Parse.Object<Parse.Attributes>;
  time: Date;
}

const MessageInfoCard: React.FC<MProps> = ({ user, time }) => {
  //avatar color
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor(
      `${user.get('firstName')} ${user.get('lastName')}`
    )}`, //function from functions/cards
  };
  return (
    <IonItem lines="none">
      <div className="messageinfo-user-card">
        <Avatar
          className="messageinfo-user-avatar"
          src={user.get('avatar')?.get('thumb')?._url}
          style={avatarStyle}
        >
          {user.get('firstName').charAt(0).toUpperCase()}
          {user.get('lastName').split(' ')[0].charAt(0).toUpperCase()}
          {user.get('lastName').split(' ')[1]?.charAt(0).toUpperCase()}
        </Avatar>
        <div className="messageinfo-user-name-area">
          <div className="messageinfo-user-name">{`${user.get(
            'firstName'
          )} ${user.get('lastName')}`}</div>
          <div className="messageinfo-user-subscript">
            {getMessageInfoDate(time)}
          </div>
        </div>
      </div>
    </IonItem>
  );
};

export default MessageInfoCard;
