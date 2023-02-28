import dateTimeToDate from './dateTimeToDate';

export default (date, days) => {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return dateTimeToDate(result.toISOString());
};
