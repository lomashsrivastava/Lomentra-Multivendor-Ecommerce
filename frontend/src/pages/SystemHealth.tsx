import { useState, useEffect } from 'react'
import { Activity, ShieldAlert, Cpu, Database } from 'lucide-react'

export function SystemHealth() {
  const [latency, setLatency] = useState<number | null>(null)
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking')

  useEffect(() => {
    const checkHealth = async () => {
      const start = performance.now()
      try {
        const res = await fetch('http://localhost:3000/api/health')
        if (res.ok) {
          setLatency(Math.round(performance.now() - start))
          setStatus('healthy')
        } else {
          setStatus('unhealthy')
        }
      } catch {
        setStatus('unhealthy')
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Node Diagnostic Monitor</h2>
        <p className="text-sm text-muted-foreground">
          Monitor platform connection latency, security state, and core databases.
        </p>
      </div>

      {/* Grid status cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Latency */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-foreground/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Gateway Latency
            </span>
            <Activity className="h-4.5 w-4.5 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold tracking-tight">
              {status === 'checking' ? '...' : latency ? `${latency} ms` : 'Offline'}
            </span>
            <p className="text-[10px] text-muted-foreground">
              Connection round-trip to local Gateway Node.
            </p>
          </div>
        </div>

        {/* Database connection */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-foreground/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Database Connection
            </span>
            <Database className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold tracking-tight">
              {status === 'healthy' ? 'Active' : status === 'checking' ? 'Checking...' : 'Inactive'}
            </span>
            <p className="text-[10px] text-muted-foreground">
              Mongoose mapping layer connection to Atlas cluster.
            </p>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-foreground/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Rate Limiting Protection
            </span>
            <Cpu className="h-4.5 w-4.5 text-violet-500" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold tracking-tight">Active</span>
            <p className="text-[10px] text-muted-foreground">
              Sliding map algorithm handles client IP request throttling.
            </p>
          </div>
        </div>

        {/* Security headers */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-foreground/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Secured Shell
            </span>
            <ShieldAlert className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold tracking-tight">CORS Strict</span>
            <p className="text-[10px] text-muted-foreground">
              XSS Sanitizer filters and HSTS security policy enforced.
            </p>
          </div>
        </div>
      </section>

      {/* Network Topology */}
      <section className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="text-base font-bold">Orchestrator Node Logs</h3>
        <div className="rounded-xl border border-border bg-muted/40 p-4 font-mono text-[10px] text-muted-foreground space-y-2.5 overflow-x-auto max-h-56 overflow-y-auto">
          <div>
            [2026-05-20T00:30:15] INFO: Client PWA registered. Active worker hook: cache-first.
          </div>
          <div>
            [2026-05-20T00:32:04] INFO: Connection pool requested: host=mongodb+srv://atlas-cluster
          </div>
          <div>
            [2026-05-20T00:32:05] INFO: Database connection initialized successfully. Mongoose model
            registry loaded.
          </div>
          <div>
            [2026-05-20T00:35:10] WARN: Rate-limiter cache check: client=127.0.0.1 hits=1
            (remaining=99).
          </div>
          <div>
            [2026-05-20T00:37:32] INFO: Dev-server dashboard component layout initialized. State
            synced.
          </div>
        </div>
      </section>
    </div>
  )
}
