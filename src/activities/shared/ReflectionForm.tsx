import { useId, useState } from 'react'

type Props = {
  question: string
  hint?: string
  onSubmit: (note: string) => void | Promise<void>
}

export default function ReflectionForm({ question, hint, onSubmit }: Props) {
  const id = useId()
  const [note, setNote] = useState('')
  const ready = note.trim().length > 0

  return (
    <div className="card stack stack--tight">
      <label htmlFor={id} className="reflection__question">{question}</label>
      {hint && <p className="faint">{hint}</p>}

      <textarea
        id={id}
        className="input reflection__input"
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button
        type="button"
        className="btn btn--primary"
        disabled={!ready}
        onClick={() => onSubmit(note)}
      >
        제출하기
      </button>
    </div>
  )
}
