import { createRouter, createWebHistory } from 'vue-router';
import NotationEditorView from '../views/NotationEditorView.vue';
import TermsAndConditionsView from '../views/TermsAndConditionsView.vue';
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: NotationEditorView
    },
    {
      path: '/terms-and-conditions',
      name: 'TermsAndConditions',
      component: TermsAndConditionsView
    },
    {
      path: '/privacy-policy',
      name: 'PrivacyPolicy',
      component: PrivacyPolicyView
    }
  ]
});

export default router; 