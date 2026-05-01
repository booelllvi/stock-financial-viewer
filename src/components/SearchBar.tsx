'use client'

import { useState, KeyboardEvent } from 'react'

interface SearchBarProps {
  onSearch: (ticker: string) => void
  loading: boolean
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const ticker = value.trim().toUpperCase()
    if (ticker) onSearch(ticker)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="glass flex items-center gap-3 px-5 py-3 w-full max-w-lg mx-auto">
      <svg
        className="w-5 h-5 flex-shrink-0"
        style={{ color: 'rgba(0,0,0,0.35)' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder="Enter ticker (e.g. AAPL)"
        maxLength={5}
        disabled={loading}
        className="flex-1 bg-transparent outline-none text-black/80 placeholder-black/30 text-base font-medium tracking-widest uppercase"
        style={{ caretColor: '#0071e3' }}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !value.trim()}
        className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: '#0071e3',
          border: '1px solid rgba(0,113,227,0.3)',
          color: 'white',
        }}
        onMouseEnter={(e) => {
          if (!loading && value.trim()) {
            ;(e.target as HTMLButtonElement).style.background = '#0077ed'
          }
        }}
        onMouseLeave={(e) => {
          ;(e.target as HTMLButtonElement).style.background = '#0071e3'
        }}
      >
        {loading ? '...' : 'Search'}
      </button>
    </div>
  )
}
