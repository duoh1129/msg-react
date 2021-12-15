import React from 'react';
import 'src/assets/sass/messagenius/pages/contacts/Contacts.scss';
import Parse from 'parse';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';
import Avatar from '@material-ui/core/Avatar';
import { IonIcon, IonItem } from '@ionic/react';
import { useHistory } from 'react-router';
import { lockClosedOutline, lockClosedSharp } from 'ionicons/icons';
import E2E from 'e2e-encryption';

export interface Props {
  data: Parse.Object<Parse.Attributes>;
}

const ContactsCard: React.FunctionComponent<Props> = ({ data }: Props) => {
  //avatar color
  let avatarStyle = {
    backgroundColor: `#${getAvatarColor(
      `${data.get('firstName')} ${data.get('lastName')}`
    )}`, //function from functions/cards
  };

  let history = useHistory();

  const getOtherUser = async (id: string) => {
    const User = Parse.Object.extend('User');
    const userQuery = new Parse.Query(User);
    userQuery.equalTo('objectId', id);
    const res = await userQuery.first();
    return res;
  };
  //create a chat room with the user you clicked on
  const createChatWithUser = async () => {
    const Conversation = Parse.Object.extend('Conversation');
    const addConversation = new Conversation();
    const currentUser = Parse.User.current();
    const query = new Parse.Query(Parse.Object.extend('_User')); //user query
    query.equalTo('objectId', data.id);
    const otherUser = await query.first();
    const participants = addConversation.relation('participants');
    participants.add(currentUser);
    participants.add(otherUser);
    const admins = addConversation.relation('admins');
    admins.add(currentUser);
    addConversation.set('type', 0);
    addConversation.set('isSecret', false);
    addConversation.set(
      'title',
      `${Parse.User.current()?.get('firstName')} ${Parse.User.current()?.get(
        'lastName'
      )}`
    );
    addConversation
      .save()
      .then((conversation: Parse.Object<Parse.Attributes>) => {
        history.replace(`/chat/${conversation.id}`);
      })
      .catch((err: any) => {
        history.replace(`/chat/${err.message}`);
      });
  };

  //create a chat room with the user you clicked on
  const createSecretChatWithUser = async () => {
    const Conversation = Parse.Object.extend('Conversation');
    const addConversation = new Conversation();
    const currentUser = Parse.User.current();
    const query = new Parse.Query(Parse.Object.extend('_User')); //user query
    query.equalTo('objectId', data.id);
    const otherUser = await query.first();
    const participants = addConversation.relation('participants');
    participants.add(currentUser);
    participants.add(otherUser);
    const admins = addConversation.relation('admins');
    admins.add(currentUser);
    addConversation.set('isSecret', true);
    addConversation.set('type', 0);
    addConversation.set(
      'title',
      `${Parse.User.current()?.get('firstName')} ${Parse.User.current()?.get(
        'lastName'
      )}`
    );

    // generate new keys
    let myKeys = new E2E('', '', { useSameKeyPerClient: false });
    addConversation.set(
      'publicKeys',
      // @ts-ignore
      { [Parse.User.current()?.id]: myKeys.publicKey }
    );

    addConversation
      .save()
      .then((conversation: Parse.Object<Parse.Attributes>) => {
        // write the keys in localStorage
        localStorage.setItem(
          `_cached_keys_${conversation.id}`,
          JSON.stringify({
            myPublicKey: myKeys.publicKey,
            myPrivateKey: myKeys.privateKey,
          })
        );
        history.replace(`/chat/${conversation.id}`);
      })
      .catch((err: any) => {
        history.replace(`/chat/${err.message}`);
      });
  };

  return (
    <IonItem
      className="contacts-card-container"
      lines="none"
      button
      onClick={createChatWithUser}
    >
      <div className="contacts-card">
        <Avatar
          className="contacts-avatar"
          src={data.get('avatar')?.get('thumb')?._url}
          style={avatarStyle}
        >
          {data.get('firstName').charAt(0).toUpperCase()}
          {data.get('lastName').split(' ')[0].charAt(0).toUpperCase()}
          {data.get('lastName').split(' ')[1]?.charAt(0).toUpperCase()}
        </Avatar>
        <div className="contacts-name-area">
          <div className="contacts-name">{`${data.get('firstName')} ${data.get(
            'lastName'
          )}`}</div>
          <div className="contacts-subscript">
            {data.get('cat1')?.get('name')}-
            {data.get('department')?.get('name')}-
            {data.get('profile')?.get('jobTitle')}
          </div>
        </div>
      </div>
      <IonIcon
        className="create-secret-chat-icon"
        onClick={(e) => {
          e.stopPropagation();
          createSecretChatWithUser();
        }}
        slot="end"
        icon={lockClosedOutline}
      />
    </IonItem>
  );
};

export default ContactsCard;
