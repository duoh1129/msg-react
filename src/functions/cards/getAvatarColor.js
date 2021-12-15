export const getAvatarColor = (str) => {
  var hash = 0;
  for (let i = 0; i < str?.length; i++) {
    hash = str?.charCodeAt(i) + ((hash << 5) - hash);
  }
  let c = (hash & 0x00ffffff)?.toString(16)?.toUpperCase();
  let colorCode = '00000'.substring(0, 6 - c?.length) + c;
  if (colorCode == '000000') colorCode = 'A0E5EE';
  return colorCode;
};
