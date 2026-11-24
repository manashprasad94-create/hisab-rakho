// Generates a sanitized UPI deep link for payment
export function generateUpiLink(upiId: string, payeeName: string, amount: number, note?: string) {
  // Sanitize name and note to plain alphanumeric to prevent UPI app parsing errors
  const cleanName = (payeeName || 'Friend').replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Friend'
  const cleanNote = (note || 'Payment').replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Payment'

  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: cleanName,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: cleanNote,
  })

  return `upi://pay?${params.toString()}`
}

export function generateAppUpiLink(
  app: 'gpay' | 'phonepe' | 'paytm' | 'generic',
  upiId: string,
  payeeName: string,
  amount: number,
  note?: string
) {
  const genericLink = generateUpiLink(upiId, payeeName, amount, note)
  const query = genericLink.replace('upi://pay?', '')

  switch (app) {
    case 'gpay':
      return `gpay://upi/pay?${query}`
    case 'phonepe':
      return `phonepe://pay?${query}`
    case 'paytm':
      return `paytmmp://pay?${query}`
    default:
      return genericLink
  }
}
