import { stat } from 'fs';
import { act } from 'react-dom/test-utils';
import { createStore } from 'redux';

//Initialization
const initialState = {
  userId: '',
  userName: '',
  user: {},
  conversation: {},
  notification: {},
  replyingToNotification: false,
  onlineList: [],
  connectedStatus: false,
};

//Actions (setUser, logOut)
export function reducer(state = initialState, action) {
  switch (action.type) {
    case 'setUserId':
      return {
        userId: action.value,
      };
    case 'setUserName':
      return {
        ...state,
        userName: action.value,
      };
    case 'setUser':
      return {
        ...state,
        user: action.value,
      };
    case 'logOut':
      return {
        userId: '',
        userName: '',
        user: undefined,
      };
    case 'setConversation':
      return {
        ...state,
        conversation: action.value,
      };
    case 'setNotification':
      return {
        ...state,
        notification: action.value,
      };
    case 'setReplyingToNotification':
      return {
        ...state,
        replyingToNotification: action.value,
      };
    case 'clearOnlineList':
      return {
        ...state,
        onlineList: [],
      };
    case 'setOnlineUsers':
      return {
        ...state,
        onlineList: action.value.length > 0 ? action.value : [action.value],
      };
    case 'addUserToOnlineList':
      return addUserToOnlineList(action.value, state);
    case 'removeUserFromOnlineList':
      return removeUserFromOnlineList(action.value, state);
    case 'setConnectedStatus':
      return { ...state, connectedStatus: action.value };
    default:
      return state;
  }
}

const addUserToOnlineList = (user, state) => {
  if (!state.onlineList?.includes(user)) {
    let newList = [...state.onlineList, user];
    return {
      ...state,
      onlineList: [...newList],
    };
  } else {
    return {
      ...state,
    };
  }
};

const removeUserFromOnlineList = (user, state) => {
  if (state.onlineList?.includes(user)) {
    //online list
    let array = state.onlineList;
    let index = state.onlineList.indexOf(user);
    //remove the offline user
    let del = array.splice(index, 1);
    //if array is empty set it to empty
    if (array.length == 0) {
      return {
        ...state,
        onlineList: [],
      };
    } else {
      //if not empty set not empty
      return {
        ...state,
        onlineList: [...array],
      };
    }
  } else {
    //else return state
    return {
      ...state,
    };
  }
};

const store = createStore(reducer);

export default store;
