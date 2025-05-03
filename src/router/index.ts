import { createRouter, createWebHistory } from 'vue-router';
import NotationEditorView from '../views/NotationEditorView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: NotationEditorView
    }
  ]
});

export default router; 