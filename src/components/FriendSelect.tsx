import { useId, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import Avatar from './Avatar'
import { Input } from './FormControls'

type FriendOption = { id: string; name: string }

export default function FriendSelect({ friends, selectedIds, multiple = false, onSelect }: {
  friends: FriendOption[]
  selectedIds: string[]
  multiple?: boolean
  onSelect: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const fieldId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const selected = friends.filter((friend) => selectedIds.includes(friend.id))
  const visible = friends.filter((friend) => friend.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const summary = multiple
    ? selected.length ? `${selected.length} friend${selected.length === 1 ? '' : 's'} selected` : 'Select friends'
    : selected[0]?.name || (selectedIds.length ? 'Person selected' : 'Select a friend')

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  return <div className="friend-select mb-4" data-open={open} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); close() }
  }}>
    <button ref={trigger} type="button" className="friend-select-trigger" aria-expanded={open} aria-controls={open ? `${fieldId}-panel` : undefined} onClick={() => setOpen(!open)} aria-label={`${multiple ? 'Friends' : 'Friend'}: ${summary}`}>
      <span className={selectedIds.length ? 'text-text' : 'text-text-muted'}>{summary}</span>
      <ChevronDown size={18} aria-hidden="true" />
    </button>
    {open && <div id={`${fieldId}-panel`} className="friend-select-panel">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <Input aria-label="Search friends" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search friends by name" className="pl-10" />
      </div>
      <div className="friend-select-options" role="group" aria-label={multiple ? 'Choose friends' : 'Choose a friend'}>
        {visible.map((friend) => <label key={friend.id} className="friend-select-option">
          <input aria-label={friend.name} type={multiple ? 'checkbox' : 'radio'} name={fieldId} checked={selectedIds.includes(friend.id)} onChange={() => {
            onSelect(friend.id)
            if (!multiple) close()
          }} />
          <Avatar name={friend.name} size="sm" />
          <span>{friend.name}</span>
        </label>)}
        {visible.length === 0 && <p className="text-sm text-text-muted p-3" role="status">No friends match your search.</p>}
      </div>
      {multiple && <button type="button" className="hk-button hk-button-secondary w-full" onClick={close}>Done</button>}
    </div>}
  </div>
}
