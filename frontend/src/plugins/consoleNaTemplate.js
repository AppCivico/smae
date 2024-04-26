/* eslint-disable no-console */
export default {
  install: (app) => {
    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$console = (...args) => {
      if (console.debug) {
        console.debug(args);
      } else {
        console.log(args);
      }
    };
  },
};
