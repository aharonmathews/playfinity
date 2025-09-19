import { useMemo, useState } from 'react'

type Props = {
  topic: string
}

const MIRROR_MAP: Record<string, string[]> = {
  A: ['∀', 'ɐ', 'Ɐ'],
  B: ['𐐒', '𐐙', 'ᗺ'],
  C: ['Ↄ', 'ɔ', 'Ͻ'],
  D: ['◖', '◗', 'ꓷ'],
  E: ['Ǝ', 'ɘ', '⋿'],
  F: ['Ⅎ', 'ᖵ', '⟘'],
  G: ['ɓ', '⅁', 'ꓨ'],
  H: ['H', 'H', 'H'],
  I: ['I', 'I', 'I'],
  J: ['ſ', 'ᒋ', 'ᒐ'],
  K: ['⋊', 'ʞ', 'ꓘ'],
  L: ['⅂', '˥', '⅃'],
  M: ['W', 'ɯ', 'Ή'],
  N: ['И', 'ᴎ', 'Ͷ'],
  O: ['O', 'O', 'O'],
  P: ['Ԁ', 'ρ', 'ꓒ'],
  Q: ['Ọ', 'Ό', 'Ϙ'],
  R: ['Я', 'ʀ', 'ꓤ'],
  S: ['Ƨ', 'ƨ', 'ϩ'],
  T: ['⊥', '┴', 'Ŧ'],
  U: ['∩', 'u', 'Ս'],
  V: ['Λ', 'ᴠ', '⋁'],
  W: ['M', 'w', 'Ш'],
  X: ['X', 'X', 'X'],
  Y: ['ʎ', '⅄', 'ɏ'],
  Z: ['Ƹ', 'ɀ', 'ꓜ'],
}

export function SpellingGame({ topic }: Props) {
  const word = useMemo(() => (topic || 'TOPIC').toUpperCase().replace(/[^A-Z]/g, ''), [topic])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null)

  const currentChar = word[index] || ''

  const options = useMemo(() => {
    if (!currentChar) return []
    const mirrors = MIRROR_MAP[currentChar] || [currentChar]
    const wrongs = mirrors.slice(0, 3)
    const opts = [currentChar, ...wrongs].slice(0, 4)
    // simple shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opts[i], opts[j]] = [opts[j], opts[i]]
    }
    return opts
  }, [currentChar])

  function handlePick(choice: string) {
    if (!currentChar) return
    const isCorrect = choice === currentChar
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) setScore((s) => s + 1)
    setTimeout(() => {
      setFeedback(null)
      if (index < word.length - 1) setIndex((i) => i + 1)
    }, 600)
  }

  if (!word) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Select a topic to start the game.</div>
  }

  const progress = word.length ? Math.round(((index + 1) / word.length) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">Character {index + 1} of {word.length}</div>
        <div className="text-sm font-medium">Score: {score}</div>
      </div>

      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded">
        <div className="h-2 bg-emerald-600 rounded" style={{ width: `${progress}%` }} />
      </div>

      <div className={`text-5xl font-semibold tracking-widest text-center py-6 ${feedback === 'correct' ? 'text-emerald-600' : feedback === 'wrong' ? 'text-red-600' : ''}`}>
        {currentChar}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePick(opt)}
            className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-4 text-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}


