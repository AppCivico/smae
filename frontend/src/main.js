import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { useRoute } from 'vue-router';
import App from './App.vue';
import { router } from './router';

const app = createApp(App);
const pinia = createPinia();

pinia.use(({ store }) => {
  // eslint-disable-next-line no-param-reassign
  store.route = useRoute();
});

app.use(pinia);
app.use(router);
app.mount('#app');
