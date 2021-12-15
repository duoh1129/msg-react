export const getMessageInfoDate = (msgTime) => {
  //set current day, month and year
  let currentTime = new Date();
  let currentDay = currentTime.getDate();
  let currentMonth = currentTime.getMonth();
  let currentYear = currentTime.getFullYear();

  //set message minute, hour, day, month and year
  let msgMinute = msgTime?.getMinutes();
  let msgHour = msgTime?.getHours();
  let msgDay = msgTime?.getDate();
  let msgMonth = msgTime?.getMonth();
  let msgYear = msgTime?.getFullYear();

  if (msgTime == undefined) {
    return '---';
  }

  if (
    currentYear == msgYear &&
    currentMonth == msgMonth &&
    currentDay == msgDay
  ) {
    //* msg is from today
    return `${msgHour > 9 ? msgHour : `0${msgHour}`}:${
      msgMinute > 9 ? msgMinute : `0${msgMinute}`
    }`;
  } else if (
    currentYear == msgYear &&
    currentMonth == msgMonth &&
    currentDay == msgDay + 1
  ) {
    //* msg is from yesterday
    return `Yesterday, ${msgHour > 9 ? msgHour : `0${msgHour}`}:${
      msgMinute > 9 ? msgMinute : `0${msgMinute}`
    }`;
  } else if (currentYear == msgYear) {
    return `${msgDay > 9 ? msgDay : `0${msgDay}`}/${
      msgMonth > 9 ? msgMonth : `0${msgMonth}`
    }, 
    ${msgHour > 9 ? msgHour : `0${msgHour}`}:${
      msgMinute > 9 ? msgMinute : `0${msgMinute}`
    }`;
  } else {
    //* msg is from before than yesterday
    return `${msgDay > 9 ? msgDay : `0${msgDay}`}/${
      msgMonth > 9 ? msgMonth : `0${msgMonth}`
    }/${msgYear}, ${msgHour > 9 ? msgHour : `0${msgHour}`}:${
      msgMinute > 9 ? msgMinute : `0${msgMinute}`
    }`;
  }
};
