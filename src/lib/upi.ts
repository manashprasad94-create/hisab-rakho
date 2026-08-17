// Generates a UPI deep link for payment
export function generateUpiLink(upiId: string, payeeName: string, amount: number, note: string) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note || 'Hisab Kitab settlement',
  })
  return `upi://pay?${params.toString()}`
}