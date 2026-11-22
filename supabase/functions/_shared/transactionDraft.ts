export type TransactionDraft = {
  amount: string | null
  reason: string
  category: 'food' | 'travel' | 'shopping' | 'entertainment' | 'other'
  direction: 'i_paid' | 'they_paid' | null
  mode: 'single' | 'group' | 'bulk' | null
  friends: string[]
  includesSelf: boolean | null
  issues: string[]
}

// Model output is untrusted. Never accept IDs, balances, or executable actions.
export function validateTransactionDraft(value: unknown): TransactionDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid draft')
  const v = value as Record<string, unknown>
  if (!(v.amount === null || (typeof v.amount === 'string' && /^\d{1,9}(\.\d{1,2})?$/.test(v.amount) && Number(v.amount) > 0)) ||
      typeof v.reason !== 'string' || v.reason.length > 200 ||
      !['food', 'travel', 'shopping', 'entertainment', 'other'].includes(String(v.category)) ||
      ![null, 'i_paid', 'they_paid'].includes(v.direction as null | string) ||
      ![null, 'single', 'group', 'bulk'].includes(v.mode as null | string) ||
      ![null, true, false].includes(v.includesSelf as null | boolean) ||
      !Array.isArray(v.friends) || v.friends.length > 30 ||
      !v.friends.every((name) => typeof name === 'string' && name.trim().length > 0 && name.length <= 100) ||
      !Array.isArray(v.issues) || v.issues.length > 8 ||
      !v.issues.every((issue) => typeof issue === 'string' && issue.length > 0 && issue.length <= 250)) {
    throw new Error('Invalid draft')
  }
  const draft = {
    amount: v.amount, reason: v.reason.trim(), category: v.category,
    direction: v.direction, mode: v.mode, includesSelf: v.includesSelf,
    friends: [...new Set(v.friends.map((name) => name.trim()))], issues: [...v.issues],
  } as TransactionDraft
  if (!draft.amount) draft.issues.push('Specify the total amount, or the amount per friend for Same Amount Each.')
  if (!draft.direction) draft.issues.push('Specify who paid or lent the money.')
  if (!draft.mode) draft.issues.push('Specify whether this is one friend, an equal split, or the same amount each.')
  if (!draft.friends.length) draft.issues.push('Include the friend names in your description.')
  if (draft.mode === 'single' && draft.friends.length !== 1) draft.issues.push('One Friend needs exactly one person.')
  if (draft.mode !== 'single' && draft.direction === 'they_paid') draft.issues.push('Shared transactions currently support you paying the full amount.')
  if (draft.mode === 'group' && draft.includesSelf !== true) draft.issues.push('An equal split currently includes you. Specify a split between you and your friends.')
  draft.issues = [...new Set(draft.issues)]
  return draft
}

export type DraftFriend = { id: string; name: string }
const normalize = (name: string) => name.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ')

export function resolveDraftFriends(names: string[], friends: DraftFriend[]) {
  const selectedIds: string[] = []
  const unresolved: string[] = []
  for (const name of names) {
    const normalized = normalize(name)
    const exact = friends.filter((friend) => normalize(friend.name) === normalized)
    const candidates = exact.length ? exact : friends.filter((friend) => normalize(friend.name).startsWith(normalized + ' '))
    if (candidates.length === 1 && !selectedIds.includes(candidates[0].id)) selectedIds.push(candidates[0].id)
    else unresolved.push(name)
  }
  return { selectedIds, unresolved }
}
