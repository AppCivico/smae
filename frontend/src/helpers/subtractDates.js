export default (date1, date2) => (new Date(date1).getTime() - new Date(date2).getTime())
  / (1000 * 3600 * 24);
