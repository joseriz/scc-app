import { auth } from '@/firebase';
import { Capacitor } from '@capacitor/core';
import { NativeFirestoreWrapper } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import router from '@/router';

const firebaseConfig = {
  projectId: "academic-ratio-261512"
};

export interface ShareableComposition {
  id: string;
  name: string;
  dateCreated: number;
  submittedBy: string;
  submittedByEmail: string;
  submittedByName: string;
  visibility: 'public' | 'private' | 'shared';
  sharedWith?: Array<{ email: string; permission: 'read' | 'write' }>;
  allowPublicWrite?: boolean;
  [key: string]: any; // For other composition data
}

export class SharingService {
  /**
   * Generate a shareable link for a composition
   */
  static generateShareLink(compositionId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${compositionId}`;
  }

  /**
   * Copy the shareable link to clipboard
   */
  static async copyShareLink(compositionId: string): Promise<boolean> {
    try {
      const shareLink = this.generateShareLink(compositionId);
      await navigator.clipboard.writeText(shareLink);
      return true;
    } catch (error) {
      console.error('Failed to copy share link:', error);
      return false;
    }
  }

  /**
   * Load a shared composition by ID
   */
  static async loadSharedComposition(compositionId: string): Promise<ShareableComposition | null> {
    try {
      let compositionData: any;

              if (Capacitor.isNativePlatform()) {
          // Use native wrapper for mobile platforms
          const nativeFirestore = new NativeFirestoreWrapper(firebaseConfig.projectId);
          compositionData = await nativeFirestore.getComposition('compositions', compositionId);
      } else {
        // Use web Firestore
        const docRef = doc(db, 'compositions', compositionId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          return null;
        }
        
        compositionData = { docId: docSnap.id, ...docSnap.data() };
      }

      if (!compositionData) {
        return null;
      }

      // Check if the composition is accessible to the current user
      const hasAccess = await this.checkCompositionAccess(compositionData);
      if (!hasAccess) {
        throw new Error('You do not have access to this composition');
      }

      return compositionData as ShareableComposition;
    } catch (error) {
      console.error('Error loading shared composition:', error);
      throw error;
    }
  }

  /**
   * Update URL to reflect current composition
   */
  static updateUrlForComposition(compositionId: string, source: 'local' | 'cloud') {
    const routeName = source === 'local' ? 'local-composition' : 'cloud-composition';
    
    // Only update URL if we're not already on the correct route
    if (router.currentRoute.value.name !== routeName || 
        router.currentRoute.value.params.id !== compositionId) {
      router.push({ 
        name: routeName, 
        params: { id: compositionId } 
      });
    }
  }

  /**
   * Navigate to home (clear composition from URL)
   */
  static navigateToHome() {
    if (router.currentRoute.value.name !== 'home') {
      router.push({ name: 'home' });
    }
  }

  /**
   * Get composition info from current route
   */
  static getCompositionFromRoute() {
    const route = router.currentRoute.value;
    
    if (route.meta.localCompositionId) {
      return {
        id: route.meta.localCompositionId as string,
        source: 'local' as const
      };
    }
    
    if (route.meta.cloudCompositionId) {
      return {
        id: route.meta.cloudCompositionId as string,
        source: 'cloud' as const
      };
    }
    
    if (route.meta.sharedCompositionId) {
      return {
        id: route.meta.sharedCompositionId as string,
        source: 'shared' as const
      };
    }
    
    return null;
  }

  /**
   * Load composition from local storage
   */
  static loadLocalComposition(compositionId: string) {
    const savedItems = localStorage.getItem('stCeciliaCompositions');
    if (!savedItems) return null;
    
    try {
      const compositions = JSON.parse(savedItems);
      return compositions.find((comp: any) => comp.id === compositionId);
    } catch (error) {
      console.error('Error loading local compositions:', error);
      return null;
    }
  }

  /**
   * Load composition from cloud
   */
  static async loadCloudComposition(compositionId: string) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to access cloud compositions');
      }

             if (Capacitor.isNativePlatform()) {
         const nativeFirestore = new NativeFirestoreWrapper(firebaseConfig.projectId);
         return await nativeFirestore.getComposition('compositions', compositionId);
       } else {
        const docRef = doc(db, 'compositions', compositionId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          return null;
        }
        
        const data = docSnap.data();
        return {
          ...data,
          docId: docSnap.id
        };
      }
    } catch (error) {
      console.error('Error loading cloud composition:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a composition
   */
  static checkCompositionAccess(composition: any): { hasAccess: boolean; message?: string } {
    const user = auth.currentUser;
    
    if (!user) {
      return { hasAccess: false, message: 'You must be logged in to access this composition' };
    }

    // Owner always has access
    if (composition.submittedBy === user.uid) {
      return { hasAccess: true };
    }

    // Check visibility settings
    if (composition.visibility === 'public') {
      return { hasAccess: true };
    }

    if (composition.visibility === 'shared' && Array.isArray(composition.sharedWith)) {
      const hasSharedAccess = composition.sharedWith.some((entry: any) => 
        entry.email === user.email
      );
      if (hasSharedAccess) {
        return { hasAccess: true };
      }
    }

    return { hasAccess: false, message: 'You do not have access to this composition' };
  }

  /**
   * Determine if the current user has write access to a composition
   */
  static determineWriteAccess(composition: ShareableComposition): boolean {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    // Owner can always write
    if (composition.submittedBy === currentUser.uid) return true;

    // Shared visibility: check sharedWith array
    if (composition.visibility === 'shared' && composition.sharedWith) {
      const entry = composition.sharedWith.find(
        share => share.email === currentUser.email
      );
      if (entry && entry.permission === 'write') return true;
    }

    // Public visibility: optional allowPublicWrite flag
    if (composition.visibility === 'public') {
      return !!composition.allowPublicWrite;
    }

    return false;
  }

  /**
   * Get access level information for display
   */
  static getAccessInfo(composition: ShareableComposition) {
    const currentUser = auth.currentUser;
    if (!currentUser) return { text: 'Read Only', class: 'access-read' };
    
    if (composition.submittedBy === currentUser.uid) {
      return { text: 'Owner', class: 'access-owner' };
    }
    
    if (this.determineWriteAccess(composition)) {
      return { text: 'Can Edit', class: 'access-write' };
    }
    
    return { text: 'Read Only', class: 'access-read' };
  }
} 