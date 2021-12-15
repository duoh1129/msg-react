import {
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonToolbar,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import ContactsOptions from 'src/assets/icon/contacts-options.png';
import { arrowBack, arrowForward, searchOutline } from 'ionicons/icons';
import ContactsGroupAvatar from 'src/components/createGroup/ContactsGroupAvatar';
import ContactsGroupCard from 'src/components/createGroup/ContactsGroupCard';
import { alphabetLowerCase } from 'src/constants/alphabet';
import Parse from 'parse';
import 'src/assets/sass/messagenius/pages/chat/ForwardMessages.scss';
import { sendMessage } from 'src/functions/chat/sendMessage';

interface AProps {
  convId: string;
  messagesToForward?: any;
  closeForward: any;
}

// this component partially "Recycles" the addContactsToGroup component

const ForwardMessages: React.FC<AProps> = ({
  convId,
  messagesToForward,
  closeForward,
}) => {
  let n = 0; //counter, every time it increases it will load 50 more users
  let downloadedAll = false;
  const [showDownloadedAll, setShowDownloadedAll] = useState<boolean>(false);

  const usersPerQuery = 20; //how many users per query

  const User = Parse.Object.extend('_User'); //user obj
  const [users, setUsers] = useState<Parse.Object<Parse.Attributes>[]>([]); //users useState

  const [groupedUsers, setGroupedUsers] = useState<{ [key: string]: any }>({}); //grouped users useState

  const [search, setSearch] = useState<string>(''); //search input useState
  const [city, setCity] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  const [departments, setDepartments] = useState<any>([]);
  const [cities, setCities] = useState<any>([]);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [hideArrowForward, setHideArrowForward] = useState(false);

  const [selected, setSelected] = useState<Parse.Object<Parse.Attributes>[]>(
    []
  );
  const [groupTitle, setGroupTitle] = useState<string | null>('');
  const [groupTitleError, setGroupTitleError] = useState<boolean>(false);

  //query users
  useEffect(() => {
    const userQueryResults = (results: Parse.Object<Parse.Attributes>[]) => {
      //set users
      n++; //increase counter
      if (n == 1) setUsers([]); //if its the first iteration or we are searching something, setUsers to nothing before going on

      if (results.length < usersPerQuery) {
        //if this is the last query with results, set downloadedAll
        downloadedAll = true;
        setShowDownloadedAll(true);
      }

      setUsers((users) => users.concat(results)); //setUsers
    };

    const userquery = async () => {
      // * search by name
      //query for the firstName as first
      const queryfirstNameFirst: any = new Parse.Query<
        Parse.Object<Parse.Attributes>
      >(User); //user firstName query
      queryfirstNameFirst.startsWith(
        'firstName',
        `${search.split(' ')[0]?.charAt(0).toUpperCase()}${search
          .split(' ')[0]
          ?.substr(1, search?.split(' ')[0]?.length - 1)
          .toLowerCase()}`
      );

      //query for the firstName as second
      const queryfirstNameSecond: any = new Parse.Query<
        Parse.Object<Parse.Attributes>
      >(User); //user firstName query
      queryfirstNameSecond.startsWith(
        'firstName',
        `${search.split(' ')[1]?.charAt(0).toUpperCase() || ''}${
          search
            .split(' ')[1]
            ?.substr(1, search?.split(' ')[1]?.length - 1)
            .toLowerCase() || ''
        }`
      );

      //query for the lastName as first
      const querylastNameFirst: any = new Parse.Query<
        Parse.Object<Parse.Attributes>
      >(User); //user lastName query
      querylastNameFirst.startsWith(
        'lastName',
        `${search.split(' ')[0]?.charAt(0).toUpperCase()}${search
          .split(' ')[0]
          ?.substr(1, search?.split(' ')[0]?.length - 1)
          .toLowerCase()}`
      );

      //query for the lastName as second
      const querylastNameSecond: any = new Parse.Query<
        Parse.Object<Parse.Attributes>
      >(User); //user lastName query
      querylastNameSecond.startsWith(
        'lastName',
        `${search.split(' ')[1]?.charAt(0).toUpperCase() || ''}${
          search
            .split(' ')[1]
            ?.substr(1, search?.split(' ')[1]?.length - 1)
            .toLowerCase() || ''
        }`
      );

      const queryfirst: any = Parse.Query.or(
        queryfirstNameFirst,
        querylastNameFirst
      );
      const querylast: any = Parse.Query.or(
        queryfirstNameSecond,
        querylastNameSecond
      );

      // mainQuery (firstName or lastName)
      const mainQuery: any = Parse.Query.and(queryfirst, querylast);
      if (department !== '') {
        const departmentQuery = new Parse.Query('Department');
        departmentQuery.equalTo('name', department);
        mainQuery.matchesKeyInQuery('department', 'objectId', departmentQuery);
      }

      if (city !== '') {
        const cityQuery = new Parse.Query('Cat1');
        cityQuery.equalTo('name', city);
        mainQuery.matchesKeyInQuery('cat1', 'objectId', cityQuery);
      }

      mainQuery.ascending('firstLastName'); // order
      mainQuery.notEqualTo('objectId', Parse.User.current()?.id); // not the current user
      mainQuery.include('profile');
      mainQuery.include('Cat1');
      mainQuery.include('department');
      mainQuery.skip(n * usersPerQuery); //skip already downlaoded users
      mainQuery.limit(usersPerQuery); //limit to x users per query
      if (!downloadedAll) {
        //query if not downloadedAll
        await mainQuery.find().then(userQueryResults);
      }
    };
    //@ts-ignore
    useEffect.userquery = userquery;
    userquery();
  }, [search, city, department]); //recall whenever city or department change or search changes

  const queryNext = ($event: CustomEvent<void>) => {
    //@ts-ignore
    useEffect.userquery();
    ($event.target as HTMLIonInfiniteScrollElement).complete();
  };

  //group users
  useEffect(() => {
    const groupUsers = (users: Parse.Object<Parse.Attributes>[]) => {
      const grouped: { [key: string]: any } = {};
      for (const user of users) {
        var firstLetter = user.get('firstName').charAt(0).toUpperCase();
        if (grouped[firstLetter] == undefined) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(user);
      }
      setGroupedUsers(grouped);
    };
    groupUsers(users);
  }, [users]);

  useEffect(() => {
    //@ts-expect-error
    if (groupTitle?.length > 20) setGroupTitleError(true);
    else setGroupTitleError(false);
  });

  const handleSelectUser = (user: Parse.Object<Parse.Attributes>) => {
    if (selected.findIndex((obj) => obj.id == user.id) != -1) {
      if (selected.length < 2) {
        setSelected([]);
      } else {
        let selArray = [...selected];
        const index = selArray.findIndex((obj) => obj.id == user.id);
        if (index !== 0) {
          let deleted = selArray.splice(index, 1);
          setSelected(selArray);
        } else {
          let deleted = selArray.shift();
          setSelected(selArray);
        }
      }
    } else {
      setSelected(selected.concat(user));
    }
  };

  const queryDepartments = async () => {
    let q = new Parse.Query('Department');
    let res = await q.find();
    let depts = res.map((res) => res.get('name'));
    setDepartments(depts);
  };

  const queryCities = async () => {
    let q = new Parse.Query('Cat1');
    let res = await q.find();
    let cities = res.map((res) => res.get('name'));
    setCities(cities);
  };

  const getOptionsBadge = () => {
    let n = 0;
    if (department?.length > 0) n++;
    if (city?.length > 0) n++;
    return n;
  };

  const forwardMessages = async () => {
    closeForward();
    let messagesToForwardArray = [...messagesToForward];
    for (let user of selected) {
      let convId;
      // get the conversation between the user and me or create it
      const Conversation = Parse.Object.extend('Conversation');
      const addConversation = new Conversation();
      const currentUser = Parse.User.current();
      const query = new Parse.Query(Parse.Object.extend('_User')); //user query
      query.equalTo('objectId', user.id);
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
      await addConversation
        .save()
        .then((conversation: Parse.Object<Parse.Attributes>) => {
          convId = conversation.id;
          for (let message of messagesToForwardArray) {
            // create the message and send it to the user
            sendMessage(
              Parse.User.current()?.id,
              conversation.id,
              { text: message.get('text') },
              undefined
            );
          }
        })
        .catch((err: any) => {
          for (let message of messagesToForwardArray) {
            // create the message and send it to the user
            sendMessage(
              Parse.User.current()?.id,
              err.message,
              { text: message.get('text') },
              undefined
            );
          }
        });
    }
  };

  const cancelForwardMessages = () => {
    closeForward();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="contacts-header-toolbar-area">
          <div className="creategroup-header">
            <div className="creategroup-backward">
              <IonIcon
                slot="start"
                icon={arrowBack}
                className="icon back-button"
                onClick={() => {
                  cancelForwardMessages();
                }}
              />
            </div>
            <div className="creategroup-header-title">Select contacts</div>
            <div className="creategroup-forward">
              {selected?.length > 0 && !hideArrowForward ? (
                <IonIcon
                  icon={arrowForward}
                  onClick={() => {
                    forwardMessages();
                  }}
                  className="icon back-button"
                />
              ) : (
                <></>
              )}
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="addcontacts-content-container">
        <div className="contacts-container">
          <div className="row-area">
            <div className="message-badge">
              <button
                style={{
                  background: 'transparent',
                  width: '34px',
                  height: 'fit-content',
                  outlineStyle: 'none',
                }}
                onClick={() => {
                  setOptionsOpen(!optionsOpen);
                  queryDepartments();
                  queryCities();
                }}
              >
                <img
                  src={ContactsOptions}
                  alt="..."
                  className="option-icon-style"
                />
              </button>
              <div className="badge-style">{`${getOptionsBadge()}`}</div>
            </div>
            <div className="search-input-area">
              <IonInput
                value={search}
                placeholder={`Search by name`}
                className="contacts-search-input-style"
                onIonChange={(e) => setSearch(e.detail.value!)}
              ></IonInput>
              <IonIcon icon={searchOutline} className="search-icon" />
            </div>
          </div>
          {optionsOpen && (
            <div className="contacts-options">
              <div className="city-search">
                <IonItem lines="none">
                  <IonSelect
                    value={city}
                    placeholder="City"
                    onIonChange={(e: any) => setCity(e.detail.value)}
                  >
                    <IonSelectOption value={''}>Any city</IonSelectOption>
                    {cities.map((city: any) => {
                      return (
                        <IonSelectOption value={city}>{city}</IonSelectOption>
                      );
                    })}
                  </IonSelect>
                </IonItem>
              </div>
              <div className="department-search">
                <IonItem lines="none">
                  <IonSelect
                    value={department}
                    placeholder="Department"
                    onIonChange={(e: any) => setDepartment(e.detail.value)}
                  >
                    <IonSelectOption value={''}>Any department</IonSelectOption>
                    {departments.map((dept: any) => {
                      return (
                        <IonSelectOption value={dept}>{dept}</IonSelectOption>
                      );
                    })}
                  </IonSelect>
                </IonItem>
              </div>
            </div>
          )}
          {selected.length > 0 && (
            <div className="selected-list">
              {selected.map((user, k) => {
                return (
                  <>
                    <ContactsGroupAvatar ParseObj={user} key={k} />
                  </>
                );
              })}
            </div>
          )}
          <IonList className="addcontacts-group-list">
            {alphabetLowerCase.map((letter, k) => {
              if (groupedUsers[letter] !== undefined) {
                let usersToShow = groupedUsers[letter];
                return (
                  <IonItemGroup key={k}>
                    <IonItemDivider className="addcontacts-group-container">
                      <IonLabel>{letter}</IonLabel>
                    </IonItemDivider>
                    {usersToShow?.map(
                      (user: Parse.Object<Parse.Attributes>, index: number) => {
                        return (
                          <IonItem
                            lines="none"
                            button
                            onClick={() => {
                              handleSelectUser(user);
                            }}
                            className={`${
                              selected.findIndex((obj) => obj.id == user.id) !=
                              -1
                                ? 'contact-selected'
                                : ''
                            } contact`}
                          >
                            {/* we can use the card for the group so as to save space */}
                            <ContactsGroupCard data={user} key={index} />
                          </IonItem>
                        );
                      }
                    )}
                  </IonItemGroup>
                );
              }
            })}
            <IonInfiniteScroll
              threshold="300px"
              disabled={false}
              onIonInfinite={(e: CustomEvent<void>) => queryNext(e)}
            >
              <IonInfiniteScrollContent loadingText="Loading more contacts..."></IonInfiniteScrollContent>
            </IonInfiniteScroll>
            {showDownloadedAll && (
              <IonLabel text-center>
                <b>There are no more contacts.</b>
              </IonLabel>
            )}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForwardMessages;
