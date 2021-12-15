//the only little problem here is that if the user scrolls up and then down again it calls infiniteScroll even if we have downloaded all objects.
//but the query won't be called so it's just a function that gets called and then doesn't do anything significative. I just wanted to point it out.
//a function to disable infiniteScroll can be added but with the search it gets very complicated...

import React, { useEffect, useState } from 'react';
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
  IonSelectOption,
  IonSelect,
} from '@ionic/react';

// images and icons
import AddMember from 'src/assets/icon/ic_newGroup.svg';
import ContactsOptions from 'src/assets/icon/contacts-options.png';
import { searchOutline } from 'ionicons/icons';

import 'src/assets/sass/messagenius/pages/contacts/Contacts.scss';
import ContactsCard from 'src/components/contacts/ContactsCard';
import Parse from 'parse';
import { alphabetLowerCase } from 'src/constants/alphabet';
import { useHistory } from 'react-router';
import { connect } from 'react-redux';
import NotificationPopUp from 'src/components/notification/NotificationPopUp';

export const updateContact = (
  updatedContact: Parse.Object<Parse.Attributes>
) => {
  //@ts-ignore
  if (Contacts.updateContact) {
    //@ts-ignore
    Contacts?.updateContact(updatedContact);
  }
};

export const deleteContact = (
  deletedContact: Parse.Object<Parse.Attributes>
) => {
  //@ts-ignore
  if (Contacts.deleteContact) {
    //@ts-ignore
    Contacts?.deleteContact(deletedContact);
  }
};
interface RProps {
  notification: any;
}

const Contacts: React.FC<RProps> = ({ notification }) => {
  let history = useHistory();

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

  const [selectedTab, setSelectedTab] = React.useState('all');
  //? probably better to delete this function and use the callback?
  const handleSelectedTab = (tab: string) => {
    setSelectedTab(tab);
  };

  //query users
  useEffect(() => {
    const userQueryResults = (
      results: Parse.Object<Parse.Attributes>[],
      online: boolean
    ) => {
      //set users
      n++; //increase counter
      if (n == 1 && online) setUsers([]); //if its the first iteration or we are searching something, setUsers to nothing before going on

      if (results.length < usersPerQuery || online) {
        //if this is the last query with results, set downloadedAll
        downloadedAll = true;
        setShowDownloadedAll(true);
      }

      if (n > 1) {
        setUsers((users) => users.concat(results)); //setUsers
      } else {
        setUsers(results); //set users (first query)
      }
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
        const departmentQuery = new Parse.Query(
          Parse.Object.extend('Department')
        );
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
      mainQuery.include('avatar');
      mainQuery.skip(n * usersPerQuery); //skip already downlaoded users
      mainQuery.limit(usersPerQuery); //limit to x users per query
      if (!downloadedAll) {
        //query if not downloadedAll
        await mainQuery.find().then((res: any) => {
          if (n == 0) {
            // if it's the first query initialize the storage items
            localStorage.setItem('_cached_contacts_list', JSON.stringify(res));
          } else {
            // if it's not the first query then get the conversations before it and concatenate with the new results
            let cachedResults =
              JSON.parse(localStorage.getItem('_cached_contacts_list') || '') ||
              [];
            let cachedResultsPlusQueryResults = [...cachedResults, res];
            localStorage.setItem(
              '_cached_contacts_list',
              JSON.stringify(cachedResultsPlusQueryResults)
            );
          }
          userQueryResults(res, true);
        });
      }
    };
    //@ts-ignore
    useEffect.userquery = userquery;
    const showCachedContacts = async () => {
      setUsers([]);
      // if it's offline then get the conversations from localStorage
      let cachedResults =
        JSON.parse(localStorage.getItem('_cached_contacts_list') || '') || [];

      let parseObjects: Parse.Object<Parse.Attributes>[] = [];

      if (cachedResults.length > 0) {
        // we need to modify the objects from localStorage adding the className to the objects so that we can then turn them back into parseObjects
        for await (let result of cachedResults) {
          let resultModified = { ...result, className: '_User' }; // adding the className property
          let parseObj = Parse.Object.fromJSON(resultModified); // crating the parse object
          parseObjects = [...parseObjects, parseObj]; // adding the objects to the array
        }
        setUsers(parseObjects);
      }
    };
    showCachedContacts(); // show cached contacts to begin with so the view is not empty. These will stay if the client has no connection
    userquery();
  }, [search, city, department]); //recall whenever city or department change or search changes

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
        var firstLetter = user?.get('firstName')?.charAt(0)?.toUpperCase();
        if (grouped[firstLetter] == undefined) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(user);
      }
      setGroupedUsers(grouped);
    };
    groupUsers(users);
  }, [users]);

  const updateContact = async (contact: Parse.Object<Parse.Attributes>) => {
    let contactsArray = [...users];
    const index = users.findIndex((obj) => obj.id == contact.id);
    let outdated = contactsArray.splice(index, 1);
    setUsers([contact, ...contactsArray]);
  };
  //@ts-ignore
  Contacts.updateContact = updateContact;

  const deleteContact = async (contact: Parse.Object<Parse.Attributes>) => {
    let contactsArray = [...users];
    const index = users.findIndex((obj) => obj.id == contact.id);
    let deleted = contactsArray.splice(index, 1);
    setUsers(contactsArray);
  };
  //@ts-ignore
  Contacts.deleteContact = deleteContact;

  const getOptionsBadge = () => {
    let n = 0;
    if (department?.length > 0) n++;
    if (city?.length > 0) n++;
    return n;
  };

  return (
    <IonPage>
      <NotificationPopUp notification={notification} />
      <IonHeader className="ion-no-border">
        <IonToolbar className="contacts-header-toolbar-area">
          <div className="contacts-header">
            <div className="contacts-header-title">Contacts</div>
            <button
              className="creategroup-button"
              onClick={() => history.replace('/newgroup')}
            >
              <img src={AddMember} alt=",,," />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="contacts-content-container">
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
                <IonItem className="contacts-options-item" lines="none">
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
                <IonItem className="contacts-options-item" lines="none">
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
          <div className="row-area">
            <div
              onClick={() => handleSelectedTab('all')}
              className={
                selectedTab === 'all'
                  ? 'tab-button tab-button-active'
                  : 'tab-button tab-button-inactive'
              }
            >
              All
            </div>
            <div
              onClick={() => handleSelectedTab('favorite')}
              className={
                selectedTab === 'favorite'
                  ? 'tab-button tab-button-active'
                  : 'tab-button tab-button-inactive'
              }
            >
              Favorite
            </div>
            <div
              onClick={() => handleSelectedTab('recent')}
              className={
                selectedTab === 'recent'
                  ? 'tab-button tab-button-active'
                  : 'tab-button tab-button-inactive'
              }
            >
              Recent
            </div>
          </div>
          {/* //TODO add contacts content */}
          {/* <div className="contacts-title">Most used</div> */}
          <IonList className="contacts-list">
            {alphabetLowerCase.map((letter, k) => {
              if (groupedUsers[letter] !== undefined) {
                let usersToShow = groupedUsers[letter];
                return (
                  <IonItemGroup key={k}>
                    <IonItemDivider className="contacts-divider-container">
                      <IonLabel>{letter}</IonLabel>
                    </IonItemDivider>
                    {usersToShow?.map(
                      (user: Parse.Object<Parse.Attributes>, index: number) => {
                        return <ContactsCard data={user} key={index} />;
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

const mapStateToProps = (state: any) => ({
  notification: state.notification,
});
export default connect(mapStateToProps)(Contacts);
