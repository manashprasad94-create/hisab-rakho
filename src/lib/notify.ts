import { supabase } from './supabase'
export async function sendEmailReminder(toEmail: string, toName: string, message: string) {
  try {
    await supabase.functions.invoke('send-reminder', {
      body: { toEmail, toName, message },
    })
    return true
  } catch (err) {
    console.error('Reminder email failed', err)
    return false
  }
}

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