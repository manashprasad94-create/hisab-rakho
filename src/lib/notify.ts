import { supabase } from './supabase'

export async function sendNotification(recipientId: string, title: string, body: string) {
  try {
    await supabase.functions.invoke('send-notification', {
      body: { recipientId, title, body },
    })
  } catch (err) {
    console.error('Notification failed to send', err)
    // don't throw — notification failure shouldn't block the main action
  }
}