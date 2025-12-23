'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to console with safe details (no sensitive data)
    console.error('[Global Error]', {
      digest: error.digest,
      message: error.message,
      name: error.name,
    })
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#fafafa',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#dc2626" 
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '0.5rem',
            }}>
              Erreur critique
            </h1>
            
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}>
              Une erreur inattendue s&apos;est produite. Veuillez rafraîchir la page ou réessayer plus tard.
            </p>
            
            {error.digest && (
              <p style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#9ca3af',
                backgroundColor: '#f3f4f6',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                marginBottom: '1.5rem',
              }}>
                Référence: {error.digest}
              </p>
            )}
            
            <button
              onClick={reset}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                width: '100%',
              }}
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

