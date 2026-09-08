import { useState } from 'react'
import './App.css'
import Character from './components/character'

type CharacterSet = 'mie' | 'dvd'

function App() {
  const [choice, setChoice] = useState<CharacterSet>('mie')

  return (
    <>
      <button onClick={() => setChoice((prev) => (prev === 'mie' ? 'dvd' : 'mie'))}>
        Change Character
      </button>
      <Character choice={choice} />
    </>
  )
}

export default App