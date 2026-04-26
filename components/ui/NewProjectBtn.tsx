'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ICNIRP: Record<string, number> = { '0.9': 41.25, '1.8': 41.25, '2.4': 41.25, '3.5': 42.0, '5': 42.8 }

export default function NewProjectBtn() {
  const [open,    setOpen]    = useState(false)
  const [name,    setName]    = useState('')
  const [desc,    setDesc]    = useState('')
  const [freq,    setFreq]    = useState('2.4')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const router = useRouter()

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--panel2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '0.7rem 1rem', color: 'var(--text)', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError('')
    const res  = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), description: desc.trim() || null, frequency: freq }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Gabim'); setLoading(false); return }
    setOpen(false); setName(''); setDesc('')
    router.push(`/project/${data.id}`)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1.2rem', background: 'var(--green-tint)', border: '1px solid var(--green-border)', borderRadius: 10, color: 'var(--green)', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2, cursor: 'pointer' }}>
        + PROJEKT I RI
      </button>

      {open && (
        <div onClick={e => e.target === e.currentTarget && setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: 2, margin: 0 }}>PROJEKT I RI</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--dim)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            {error && <div style={{ background: 'var(--red-tint)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '0.75rem', color: 'var(--red)', fontSize: 12, marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={create}>
              {[['Emri *', 'text', name, setName, 'Matjet WiFi — Tiranë 2024'], ['Përshkrimi', 'text', desc, setDesc, 'Opsional...']] .map(([label, type, value, set, ph]) => (
                <div key={label as string} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: 'var(--dim)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{label as string}</label>
                  {label === 'Përshkrimi'
                    ? <textarea value={value as string} onChange={e => (set as any)(e.target.value)} rows={3} placeholder={ph as string} style={{ ...inp, resize: 'none' }} />
                    : <input type={type as string} value={value as string} onChange={e => (set as any)(e.target.value)} placeholder={ph as string} style={inp} required={label === 'Emri *'} />
                  }
                </div>
              ))}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--dim)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Frekuenca WiFi</label>
                <select value={freq} onChange={e => setFreq(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {Object.entries(ICNIRP).map(([f, l]) => <option key={f} value={f}>{f} GHz — ICNIRP: {l} V/m</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--dim)', fontSize: 13, cursor: 'pointer' }}>Anulo</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--green-tint)', border: '1px solid var(--green-border)', borderRadius: 8, color: 'var(--green)', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
                  {loading ? '...' : 'KRIJO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
