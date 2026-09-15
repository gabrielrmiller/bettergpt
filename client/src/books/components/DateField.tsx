import { useEffect, useRef, useState } from 'react'
import { formatDate, isoToParts, partsToIso } from '../dates'

type DateFieldProps = {
  id: string
  value: string | null
  onChange: (deadline: string | null) => void
}

function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

export function DateField({ id, value, onChange }: DateFieldProps) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [invalid, setInvalid] = useState(false)
  const partsRef = useRef({ day: '', month: '', year: '' })

  useEffect(() => {
    const parts = isoToParts(value)
    setDay(parts.day)
    setMonth(parts.month)
    setYear(parts.year)
    partsRef.current = parts
    setInvalid(false)
  }, [value])

  function setPart(part: 'day' | 'month' | 'year', raw: string) {
    const next = digitsOnly(raw)
    partsRef.current = { ...partsRef.current, [part]: next }
    if (part === 'day') setDay(next)
    if (part === 'month') setMonth(next)
    if (part === 'year') setYear(next)
    commit()
  }

  function commit() {
    const { day: d, month: m, year: y } = partsRef.current
    if (!d.trim() && !m.trim() && !y.trim()) {
      setInvalid(false)
      if (value) onChange(null)
      return
    }
    if (!d.trim() || !m.trim() || !y.trim()) {
      setInvalid(false)
      return
    }
    const iso = partsToIso(d, m, y)
    if (!iso) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    if (iso !== value) onChange(iso)
  }

  return (
    <div className="date-field">
      <p className="date-field__label" id={`${id}-label`}>
        Finish by
      </p>
      <div className="date-fields" role="group" aria-labelledby={`${id}-label`}>
        <label>
          Day
          <input
            id={`${id}-day`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={2}
            placeholder="DD"
            value={day}
            onChange={(event) => setPart('day', event.target.value)}
            onBlur={commit}
          />
        </label>
        <label>
          Month
          <input
            id={`${id}-month`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={2}
            placeholder="MM"
            value={month}
            onChange={(event) => setPart('month', event.target.value)}
            onBlur={commit}
          />
        </label>
        <label>
          Year
          <input
            id={`${id}-year`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={4}
            placeholder="YYYY"
            value={year}
            onChange={(event) => setPart('year', event.target.value)}
            onBlur={commit}
          />
        </label>
      </div>
      {value ? <p className="date-field__preview">{formatDate(value)}</p> : null}
      {invalid ? <p className="date-field__error">Use a real day / month / year.</p> : null}
      {value ? (
        <button
          type="button"
          className="text-button"
          onClick={() => {
            partsRef.current = { day: '', month: '', year: '' }
            setDay('')
            setMonth('')
            setYear('')
            setInvalid(false)
            onChange(null)
          }}
        >
          Clear date
        </button>
      ) : null}
    </div>
  )
}
