interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      className="glass w-full px-6 py-5 flex items-center gap-4"
      style={{
        background: 'rgba(217, 48, 37, 0.07)',
        borderColor: 'rgba(217, 48, 37, 0.2)',
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(217,48,37,0.12)', border: '1px solid rgba(217,48,37,0.25)' }}
      >
        <span style={{ color: '#d93025', fontSize: '16px', fontWeight: 'bold' }}>!</span>
      </div>
      <p className="text-sm font-medium" style={{ color: '#b71c1c' }}>
        {message}
      </p>
    </div>
  )
}
