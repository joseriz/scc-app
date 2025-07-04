import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithCredential, signOut, getRedirectResult } from 'firebase/auth';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/logger';

export const useAuth = () => {
  const googleSignIn = async () => {
    try {
      // Check if we're on a native platform (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        logger.info('Attempting native Google sign-in...');
        
        try {
          // Initialize SocialLogin with Google configuration
          await SocialLogin.initialize({
            google: {
              webClientId: '377945407536-65mcijb46gdkdf5crhn8va8sq79vobi2.apps.googleusercontent.com',
              mode: 'online'
            }
          });
          logger.info('SocialLogin initialized successfully');
          
          // Try to sign in - remove custom scopes to avoid MainActivity requirement
          const result = await SocialLogin.login({
            provider: 'google',
            options: {}
          });
          logger.info('Native Google sign-in successful:', result);

          // Validate the result structure - new plugin structure
          if (!result || !result.result || !result.result.idToken) {
            throw new Error('Invalid authentication result from native Google Auth');
          }

          // Create Firebase credential from the result
          const credential = GoogleAuthProvider.credential(result.result.idToken);
          const firebaseResult = await signInWithCredential(auth, credential);
          
          logger.info('Firebase authentication successful:', firebaseResult.user.email);
          return firebaseResult;
        } catch (nativeError) {
          logger.error('Native Google sign-in failed with error:', nativeError);
          
          // Log specific error details
          if (nativeError.code) {
            logger.error('Error code:', nativeError.code);
          }
          if (nativeError.message) {
            logger.error('Error message:', nativeError.message);
          }
          
          // Handle specific error codes
          if (nativeError.message && nativeError.message.includes('[16]')) {
            // Account reauth failed - try to clear cached credentials and retry
            try {
              logger.info('Attempting to clear cached credentials and retry...');
              await SocialLogin.logout({ provider: 'google' });
              
              // Retry the sign-in process
              const retryResult = await SocialLogin.login({
                provider: 'google',
                options: {}
              });
              
              if (retryResult && retryResult.result && retryResult.result.idToken) {
                const credential = GoogleAuthProvider.credential(retryResult.result.idToken);
                const firebaseResult = await signInWithCredential(auth, credential);
                logger.info('Retry successful after clearing cache:', firebaseResult.user.email);
                return firebaseResult;
              }
            } catch (retryError) {
              logger.error('Retry after clearing cache failed:', retryError);
            }
            
            throw new Error('Account authentication expired. Please try signing in again or restart the app.');
          }
          
          // Don't fall back to web auth - throw the error to show what's really happening
          throw new Error(`Native Google Sign-In failed: ${nativeError.message || 'Unknown error'}`);
        }
      } else {
        // Web platform - use popup
        logger.info('Using web-based Google sign-in...');
        
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        return await signInWithPopup(auth, provider);
      }
    } catch (error) {
      logger.error('Google sign-in error:', error);
      
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
      logger.error('Sign out error:', error);
      throw error;
    }
  };

  const clearAuthCache = async () => {
    try {
      logger.info('Clearing authentication cache...');
      
      if (Capacitor.isNativePlatform()) {
        // Clear native authentication cache
        await SocialLogin.logout({ provider: 'google' });
      }
      
      // Sign out from Firebase
      await signOut(auth);
      
      logger.info('Authentication cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing auth cache:', error);
      throw new Error('Failed to clear authentication cache. Please restart the app.');
    }
  };

  const checkRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        logger.info('Redirect result found:', result.user.email);
        return result;
      }
    } catch (error) {
      logger.error('Error checking redirect result:', error);
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