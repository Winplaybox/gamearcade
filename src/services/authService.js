import { signInAnonymously, signOut } from '@firebase/auth';
import { auth } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_STORE_UID_KEY = 'winplaybox_anon_uid';

export const SYNC_STORAGE_KEY = 'winplaybox_cloud_sync_enabled';

/**
 * Initializes a silent Firebase Anonymous session for the device.
 * Persists the UID securely so it survives app restarts.
 */
export async function initializeAnonymousSession() {
  try {
    // Check if we already have a stored session UID locally
    const storedUid = await SecureStore.getItemAsync(SECURE_STORE_UID_KEY);
    
    // Sign into Firebase silently
    const userCredential = await signInAnonymously(auth);
    const currentUid = userCredential.user.uid;

    if (!storedUid || storedUid !== currentUid) {
      await SecureStore.setItemAsync(SECURE_STORE_UID_KEY, currentUid);
      console.log('✅ New Anonymous Firebase Session created:', currentUid);
    } else {
      console.log('✅ Restored Anonymous Firebase Session:', currentUid);
    }

    return currentUid;
  } catch (error) {
    console.warn('❌ Firebase Anonymous Auth Failed:', error);
    return null;
  }
}

/**
 * Signs out the anonymous user and clears local UID.
 */
export async function disableAnonymousSession() {
  try {
    await signOut(auth);
    await SecureStore.deleteItemAsync(SECURE_STORE_UID_KEY);
    await AsyncStorage.setItem(SYNC_STORAGE_KEY, 'false');
    console.log('✅ Signed out of Anonymous Session');
  } catch (error) {
    console.warn('❌ Failed to sign out:', error);
  }
}
