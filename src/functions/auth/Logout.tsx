import Parse from 'parse';

export const logOut = () => {
  Parse.User.logOut();
  window.location.reload();
};
