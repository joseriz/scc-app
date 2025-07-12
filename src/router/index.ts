import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import NotationEditorView from '../views/NotationEditorView.vue';
import TermsAndConditionsView from '../views/TermsAndConditionsView.vue';
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue';
import AdminView from '../views/AdminView.vue';
import { auth } from '@/firebase';

// Navigation guard for admin route
const requireAdmin = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const ADMIN_EMAILS = [
    'joserizc@gmail.com'
    // Add your admin email addresses here
  ];
  
  // Wait for auth state to be ready
  const user = auth.currentUser;
  if (user && ADMIN_EMAILS.includes(user.email || '')) {
    next();
  } else {
    next('/');
  }
};

// Navigation guard for shared composition route
const handleSharedComposition = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const compositionId = to.params.id as string;
  
  if (!compositionId) {
    next('/');
    return;
  }

  // Store the composition ID in the route meta for the component to access
  to.meta.sharedCompositionId = compositionId;
  next();
};

// Navigation guard for cloud composition route
const handleCloudComposition = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const compositionId = to.params.id as string;
  
  if (!compositionId) {
    next('/');
    return;
  }

  // Store the composition ID in the route meta for the component to access
  to.meta.cloudCompositionId = compositionId;
  next();
};

// Navigation guard for local composition route
const handleLocalComposition = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const compositionId = to.params.id as string;
  
  if (!compositionId) {
    next('/');
    return;
  }

  // Store the composition ID in the route meta for the component to access
  to.meta.localCompositionId = compositionId;
  next();
};

// Add type declaration for import.meta.env
declare global {
  interface ImportMeta {
    env: {
      BASE_URL: string;
      [key: string]: string;
    };
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: NotationEditorView
    },
    {
      path: '/local/:id',
      name: 'local-composition',
      component: NotationEditorView,
      beforeEnter: handleLocalComposition
    },
    {
      path: '/cloud/:id',
      name: 'cloud-composition',
      component: NotationEditorView,
      beforeEnter: handleCloudComposition
    },
    {
      path: '/shared/:id',
      name: 'shared-composition',
      component: NotationEditorView,
      beforeEnter: handleSharedComposition
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
    },
    {
      path: '/admin',
      name: 'Admin',
      component: AdminView,
      beforeEnter: requireAdmin
    }
  ]
});

export default router; 