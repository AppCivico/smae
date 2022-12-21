import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { useRoute } from 'vue-router';

const app = createApp(App);
const pinia = createPinia();

pinia.use(({ store }) => {
  store.route = useRoute();
})

app.use(pinia);
app.use(router);
app.mount('#app');
