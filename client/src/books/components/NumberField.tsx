import { useEffect, useState } from 'react'

type NumberFieldProps = {
  id?: string
  label: string
  value: number
  min?: number
  placeholder?: string
  required?: boolean
  onCommit: (value: number) => void
}

function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

export function NumberField({
  id,
  label,
  value,
  min = 0,
  placeholder,
  required,
  onCommit,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(String(value))
  }, [focused, value])

  function commit(raw: string) {
    const parsed = Number(digitsOnly(raw))
    if (!Number.isFinite(parsed) || raw.trim() === '') {
      setDraft(String(value))
      return
    }
    onCommit(Math.max(min, Math.floor(parsed)))
  }

  return (
    <label>
      {label}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={focused ? draft : String(value)}
        onFocus={() => {
          setFocused(true)
          setDraft(String(value))
        }}
        onChange={(event) => setDraft(digitsOnly(event.target.value))}
        onBlur={() => {
          setFocused(false)
          commit(draft)
        }}
      />
    </label>
  )
}
