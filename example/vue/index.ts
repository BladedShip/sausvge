import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

const container = document.getElementById('root');
if (container) {
  const app = createApp(App);
  app.mount(container);
}

