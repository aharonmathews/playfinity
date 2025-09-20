import { useMemo, useState } from 'react'

type Props = {
  topic: string
  onGameComplete?: () => void
}

// Mirror reflections: [left_mirror, right_mirror, bottom_mirror]
const MIRROR_MAP: Record<string, string[]> = {
  A: ['∀', 'A', 'ɐ'], // left, right, bottom
  B: ['ᗺ', 'B', '𐐒'], // left, right, bottom
  C: ['Ↄ', 'C', 'ɔ'], // left, right, bottom
  D: ['ꓷ', 'D', '◖'], // left, right, bottom
  E: ['Ǝ', 'E', 'ɘ'], // left, right, bottom
  F: ['ᖵ', 'F', 'Ⅎ'], // left, right, bottom
  G: ['⅁', 'G', 'ɓ'], // left, right, bottom
  H: ['H', 'H', 'H'], // H is symmetric
  I: ['I', 'I', 'I'], // I is symmetric
  J: ['ᒐ', 'J', 'ſ'], // left, right, bottom
  K: ['ꓘ', 'K', 'ʞ'], // left, right, bottom
  L: ['⅃', 'L', '⅂'], // left, right, bottom
  M: ['W', 'M', 'ɯ'], // left, right, bottom
  N: ['И', 'N', 'ᴎ'], // left, right, bottom
  O: ['O', 'O', 'O'], // O is symmetric
  P: ['Ԁ', 'P', 'ρ'], // left, right, bottom
  Q: ['Ϙ', 'Q', 'Ọ'], // left, right, bottom
  R: ['ꓤ', 'R', 'Я'], // left, right, bottom
  S: ['Ƨ', 'S', 'ƨ'], // left, right, bottom
  T: ['⊥', 'T', '┴'], // left, right, bottom
  U: ['Ս', 'U', '∩'], // left, right, bottom
  V: ['Λ', 'V', '⋁'], // left, right, bottom
  W: ['M', 'W', 'w'], // left, right, bottom
  X: ['X', 'X', 'X'], // X is symmetric
  Y: ['⅄', 'Y', 'ʎ'], // left, right, bottom
  Z: ['Ƹ', 'Z', 'ɀ'], // left, right, bottom
}

export function SpellingGame({ topic, onGameComplete }: Props) {
  const word = useMemo(() => (topic || 'TOPIC').toUpperCase().replace(/[^A-Z]/g, ''), [topic])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null)
  const [message, setMessage] = useState<string>('')

  const currentChar = word[index] || ''

  const options = useMemo(() => {
    if (!currentChar) return []
    const mirrors = MIRROR_MAP[currentChar] || [currentChar, currentChar, currentChar]
    // Create options: correct character + 3 mirror reflections
    const opts = [currentChar, ...mirrors]
    // Shuffle the options
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opts[i], opts[j]] = [opts[j], opts[i]]
    }
    return opts
  }, [currentChar])

  function handlePick(choice: string) {
    if (!currentChar) return
    const isCorrect = choice === currentChar
    
    if (isCorrect) {
      setFeedback('correct')
      setMessage('Correct Option')
      setScore((s) => s + 1)
      setTimeout(() => {
        setFeedback(null)
        setMessage('')
        if (index < word.length - 1) {
          setIndex((i) => i + 1)
        } else {
          // Game completed!
          onGameComplete?.()
        }
      }, 1500)
    } else {
      setFeedback('wrong')
      setMessage('Wrong option - Try again!')
      setTimeout(() => {
        setFeedback(null)
        setMessage('')
      }, 1500)
    }
  }

  if (!word) {
    return <div className="text-sm text-gray-500">Select a topic to start the game.</div>
  }

  const progress = word.length ? Math.round(((index + 1) / word.length) * 100) : 0

  const navigateHome = () => window.location.href = '/';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
  <div className="text-sm text-gray-500">Character {index + 1} of {word.length}</div>
        <div className="text-sm font-medium">Score: {score}</div>
      </div>

  <div className="h-2 bg-gray-200 rounded">
        <div className="h-2 bg-emerald-600 rounded" style={{ width: `${progress}%` }} />
      </div>

      <div className={`text-5xl font-semibold tracking-widest text-center py-6 ${feedback === 'correct' ? 'text-emerald-600' : feedback === 'wrong' ? 'text-red-600' : ''}`}>
        {currentChar}
      </div>

      {message && (
        <div className={`text-center py-2 text-lg font-medium ${
          feedback === 'correct' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {message}
        </div>
      )}

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={navigateHome} className="rounded bg-indigo-600 text-white px-4 py-2 shadow-lg hover:bg-indigo-700">Home</button>
      </div>
        {options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePick(opt)}
            className={`rounded-lg border px-3 py-4 text-xl font-semibold hover:bg-gray-50 transition-colors ${
              feedback === 'correct' && opt === currentChar
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200'
            }`}
            disabled={feedback !== null}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}



