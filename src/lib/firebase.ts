import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// Request permission, get FCM token, save it to profiles table
export async function registerPushNotifications() {
  const supported = await isSupported()
  if (!supported) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const messaging = getMessaging(app)
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  })

  if (token) {
    const userId = useAuthStore.getState().user?.id
    if (userId) {
      await supabase.from('profiles').update({ fcm_token: token }).eq('id', userId)
    }
  }

  return token
}

// Listen for foreground messages (app open) and show them
export async function listenForMessages(callback: (payload: any) => void) {
  const supported = await isSupported()
  if (!supported) return
  const messaging = getMessaging(app)
  onMessage(messaging, callback)
}