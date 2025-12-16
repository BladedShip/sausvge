import App from './App.svelte';

const container = document.getElementById('root');
if (container) {
  new App({
    target: container,
  });
}

