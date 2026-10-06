export function localDate(monthOnly = false): string {
  const today = new Date()
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  return monthOnly ? month : `${month}-${String(today.getDate()).padStart(2, '0')}`
}
