import { useEffect, useState } from 'react';
import {
  IonContent,
  IonIcon,
  IonInput,
  IonPage,
  IonHeader,
  IonToolbar,
  IonList,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonItem,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonViewWillLeave,
  useIonViewDidLeave,
  IonSelectOption,
  IonSelect,
} from '@ionic/react';

// images and icons
import ContactsOptions from 'src/assets/icon/contacts-options.png';
import { arrowBack, arrowForward, searchOutline } from 'ionicons/icons';

import 'src/assets/sass/messagenius/pages/contacts/Contacts.scss';
import 'src/assets/sass/messagenius/pages/createGroup/CreateGroup.scss';
import ContactsGroupCard from '../../components/createGroup/ContactsGroupCard';
import Parse from 'parse';
import { alphabetLowerCase } from 'src/constants/alphabet';
import { useHistory } from 'react-router';
import ContactsGroupAvatar from 'src/components/createGroup/ContactsGroupAvatar';
import { connect } from 'react-redux';
import { Avatar } from '@material-ui/core';
import { getAvatarColor } from 'src/functions/cards/getAvatarColor';

// export const updateContact = (
//   updatedContact: Parse.Object<Parse.Attributes>
// ) => {
//   console.log('updated contact');
//   //@ts-ignore
//   CreateGroup.updateContact(updatedContact);
// };

// export const deleteContact = (
//   deletedContact: Parse.Object<Parse.Attributes>
// ) => {
//   console.log('deleted contact');
//   //@ts-ignore
//   CreateGroup.deleteContact(deletedContact);
// };

const CreateGroup: React.FC = () => {
  //! global
  const [view, setView] = useState<number>(0); //windows to show > 0: select contacts, 1: enter group info
  const history = useHistory();

  //! code relive to window 0
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
    if (view == 0) userquery();
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

  // const updateContact = async (contact: Parse.Object<Parse.Attributes>) => {
  //   let contactsArray = [...users];
  //   const index = users.findIndex((obj) => obj.id == contact.id);
  //   let outdated = contactsArray.splice(index, index);
  //   setUsers([contact, ...contactsArray]);
  // };
  // //@ts-ignore
  // CreateGroup.updateContact = updateContact;

  // const deleteContact = async (contact: Parse.Object<Parse.Attributes>) => {
  //   let contactsArray = [...users];
  //   const index = users.findIndex((obj) => obj.id == contact.id);
  //   let deleted = contactsArray.splice(index, index);
  //   setUsers(contactsArray);
  // };
  // //@ts-ignore
  // CreateGroup.deleteContact = deleteContact;

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

  //!code relative to window 1

  const createGroupFunction = async () => {
    setHideArrowForward(true);
    if (!hideArrowForward) {
      const Conversation = Parse.Object.extend('Conversation');
      const addConversation = new Conversation();
      const currentUser = Parse.User.current();
      const participants = addConversation.relation('participants');
      participants.add(currentUser);
      const admins = addConversation.relation('admins');
      admins.add(currentUser);
      for (const user of selected) {
        participants.add(user);
      }
      addConversation.set('type', 1);
      addConversation.set('title', groupTitle);
      addConversation
        .save()
        .then((conversation: Parse.Object<Parse.Attributes>) => {
          history.replace(`/chat/${conversation.id}`);
        })
        .catch((err: any) => {
          history.replace(`/chat/${err.message}`);
        });
    }
  };

  return (
    <>
      {view == 0 && (
        <IonPage>
          <IonHeader className="ion-no-border">
            <IonToolbar className="contacts-header-toolbar-area">
              <div className="creategroup-header">
                <div className="creategroup-backward">
                  <IonIcon
                    slot="start"
                    icon={arrowBack}
                    className="icon back-button"
                    onClick={() => {
                      history.replace('/tabs/contacts');
                    }}
                  />
                </div>
                <div className="creategroup-header-title">New Group</div>
                <div className="creategroup-forward">
                  {selected?.length > 0 && !hideArrowForward ? (
                    <IonIcon
                      icon={arrowForward}
                      onClick={() => setView(1)}
                      className="icon back-button"
                    />
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </IonToolbar>
          </IonHeader>
          <IonContent className="creategroup-content-container">
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
                            <IonSelectOption value={city}>
                              {city}
                            </IonSelectOption>
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
                        <IonSelectOption value={''}>
                          Any department
                        </IonSelectOption>
                        {departments.map((dept: any) => {
                          return (
                            <IonSelectOption value={dept}>
                              {dept}
                            </IonSelectOption>
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
              <IonList className="contacts-group-list">
                {alphabetLowerCase.map((letter, k) => {
                  if (groupedUsers[letter] !== undefined) {
                    let usersToShow = groupedUsers[letter];
                    return (
                      <IonItemGroup key={k}>
                        <IonItemDivider className="contacts-group-container">
                          <IonLabel>{letter}</IonLabel>
                        </IonItemDivider>
                        {usersToShow?.map(
                          (
                            user: Parse.Object<Parse.Attributes>,
                            index: number
                          ) => {
                            return (
                              <IonItem
                                lines="none"
                                button
                                onClick={() => {
                                  handleSelectUser(user);
                                }}
                                className={`${
                                  selected.findIndex(
                                    (obj) => obj.id == user.id
                                  ) != -1
                                    ? 'contact-selected'
                                    : ''
                                } contact`}
                              >
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
      )}
      {view == 1 && (
        <IonPage>
          <IonHeader className="ion-no-border">
            <IonToolbar className="contacts-header-toolbar-area">
              <div className="creategroup-header">
                <div className="creategroup-backward">
                  <IonIcon
                    slot="start"
                    icon={arrowBack}
                    className="icon back-button"
                    onClick={() => {
                      setView(0);
                    }}
                  />
                </div>
                <div className="creategroup-header-title">New Group</div>
                <div className="creategroup-forward">
                  {/* @ts-expect-error */}
                  {!groupTitleError && groupTitle?.length > 0 ? (
                    <IonIcon
                      icon={arrowForward}
                      onClick={createGroupFunction}
                      className="icon back-button"
                    />
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </IonToolbar>
          </IonHeader>
          <IonContent className="creategroup-content-container">
            <div className="creategroup-settings-form">
              <Avatar
                style={{
                  height: '80px',
                  width: '80px',
                  fontSize: '30px',
                  backgroundColor: `#${getAvatarColor(groupTitle)}`,
                }}
                className="creategroup-avatar"
              >
                {groupTitle?.split(' ')[0].charAt(0).toUpperCase()}
                {(groupTitle?.split(' ')[1] == undefined ||
                  groupTitle?.split(' ')[1] == '') &&
                  `${groupTitle?.charAt(1).toUpperCase()}`}
                {groupTitle?.split(' ')[1]?.charAt(0).toUpperCase()}
                {groupTitle?.split(' ')[2]?.charAt(0).toUpperCase()}
                {groupTitle == '' && 'MG'}
              </Avatar>
              <IonInput
                type="text"
                className="group-title-input"
                placeholder="Group title"
                value={groupTitle}
                onIonChange={(e) => {
                  if (e.detail.value === undefined) return;
                  setGroupTitle(e?.detail?.value);
                }}
              />
            </div>
            {groupTitleError && (
              <div className="group-title-error">
                Group title must be less than 21 characters long.
              </div>
            )}
            <div className="group-participants-count">
              <h2>Participants: {selected?.length}</h2>
            </div>
            <div className="group-participants">
              {selected.map((user, k) => {
                return (
                  <>
                    <ContactsGroupAvatar ParseObj={user} key={k} />
                  </>
                );
              })}
            </div>
          </IonContent>
        </IonPage>
      )}
    </>
  );
};

const mapStateToProps = (state: any) => ({});

export default connect(mapStateToProps)(CreateGroup);
