import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { supabase } from './supabase'
export async function sendEmailReminder(transactionId: string) {
  const { data, error } = await supabase.functions.invoke('send-reminder', {
    body: { transactionId },
  })
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response
    const body = await response.json().catch(() => null)
    if (response.status === 401) {
      throw new Error('Your session could not be verified. Sign out and sign in again, then retry.')
    }
    if (response.status === 404) {
      throw new Error('The send-reminder function is not deployed in Supabase.')
    }
    throw new Error(typeof body?.error === 'string'
      ? body.error
      : `Reminder failed (HTTP ${response.status}). Check the send-reminder logs in Supabase.`)
  }
  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
    throw new Error('Could not reach the reminder service. Check your connection and the Supabase function deployment.')
  }
  if (error) throw error
  if (data?.success !== true) throw new Error('The reminder service did not confirm sending the email.')
}

export async function sendNotification(recipientId: string, title: string, body: string, actionUrl?: string) {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: { recipientId, title, body, actionUrl },
    })
    if (error) throw error
  } catch (err) {
    console.error('Notification failed to send', err)
  }
}
