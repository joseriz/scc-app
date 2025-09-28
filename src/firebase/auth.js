import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithCredential, signOut, getRedirectResult } from 'firebase/auth';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';

export const useAuth = () => {
  const googleSignIn = async () => {
    try {
      // Check if we're on a native platform (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        // Attempting native Google sign-in
        
        try {
          // Initialize SocialLogin with Google configuration
          await SocialLogin.initialize({
            google: {
              webClientId: '377945407536-65mcijb46gdkdf5crhn8va8sq79vobi2.apps.googleusercontent.com',
              mode: 'online'
            }
          });
          // SocialLogin initialized successfully
          
          // Try to sign in - remove custom scopes to avoid MainActivity requirement
          const result = await SocialLogin.login({
            provider: 'google',
            options: {}
          });
          // Native Google sign-in successful

          // Validate the result structure - new plugin structure
          if (!result || !result.result || !result.result.idToken) {
            throw new Error('Invalid authentication result from native Google Auth');
          }

          // Create Firebase credential from the result
          const credential = GoogleAuthProvider.credential(result.result.idToken);
          const firebaseResult = await signInWithCredential(auth, credential);
          
          // Firebase authentication successful
          return firebaseResult;
        } catch (nativeError) {
          // Native Google sign-in failed with error
          
          // Log specific error details
          if (nativeError.code) {
            // Error code
          }
          if (nativeError.message) {
            // Error message
          }
          
          // Handle specific error codes
          if (nativeError.message && nativeError.message.includes('[16]')) {
            // Account reauth failed - try to clear cached credentials and retry
            try {
              // Attempting to clear cached credentials and retry
              await SocialLogin.logout({ provider: 'google' });
              
              // Retry the sign-in process
              const retryResult = await SocialLogin.login({
                provider: 'google',
                options: {}
              });
              
              if (retryResult && retryResult.result && retryResult.result.idToken) {
                const credential = GoogleAuthProvider.credential(retryResult.result.idToken);
                const firebaseResult = await signInWithCredential(auth, credential);
                // Retry successful after clearing cache
                return firebaseResult;
              }
            } catch (retryError) {
              // Retry after clearing cache failed
            }
            
            throw new Error('Account authentication expired. Please try signing in again or restart the app.');
          }
          
          // Don't fall back to web auth - throw the error to show what's really happening
          throw new Error(`Native Google Sign-In failed: ${nativeError.message || 'Unknown error'}`);
        }
      } else {
        // Web platform - use popup
        // Using web-based Google sign-in
        
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        return await signInWithPopup(auth, provider);
      }
    } catch (error) {
      // Google sign-in error
      
      // Provide more specific error handling
      if (error.message && error.message.includes('disallowed_useragent')) {
        throw new Error('Please use a different browser or update your current browser.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await SocialLogin.logout({ provider: 'google' });
      }
      await signOut(auth);
    } catch (error) {
      // Sign out error
      throw error;
    }
  };

  const clearAuthCache = async () => {
    try {
      // Clearing authentication cache
      
      if (Capacitor.isNativePlatform()) {
        // Clear native authentication cache
        await SocialLogin.logout({ provider: 'google' });
      }
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Authentication cache cleared successfully
    } catch (error) {
      // Error clearing auth cache
      throw new Error('Failed to clear authentication cache. Please restart the app.');
    }
  };

  const checkRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        // Redirect result found
        return result;
      }
    } catch (error) {
      // Error checking redirect result
    }
    return null;
  };

  return {
    googleSignIn,
    signOut: signOutUser,
    clearAuthCache,
    checkRedirectResult
  };
}; 