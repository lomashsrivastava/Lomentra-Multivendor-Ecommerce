import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e0d_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e0d_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              S
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              SaaS API Gateway
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              v1.0.0
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/api/health"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50"
            >
              Test Gateway Status
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full space-y-12">
        {/* Welcome Section */}
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Developer Console & Metrics Hub
          </h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed text-sm">
            Welcome to the backend orchestrator. This node serves as the secure database access
            layer, identity manager, and AI agent broker for the Multi-Vendor SaaS commerce
            platform.
          </p>
        </section>

        {/* System Diagnostics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Database Health Card */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 hover:border-zinc-700 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Database Layer
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold">MongoDB Atlas connection</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Mongoose client layer active. Pool connection handles dynamic caching models. Managed
              via database wrappers.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
              <span>Status: CONNECTED</span>
              <span>Pool Size: 10</span>
            </div>
          </div>

          {/* Rate Limiting Card */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 hover:border-zinc-700 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Security Layer
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold">IP Rate Limiting</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Requests throttled to 100 requests per 15 minutes window. Applying X-RateLimit headers
              recursively.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
              <span>Limit: 100req / 15m</span>
              <span>Algorithm: Sliding Map</span>
            </div>
          </div>

          {/* Security Headers Card */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 hover:border-zinc-700 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Middleware Filters
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold">Headers & Sanitizer</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              CORS permissions configured. Clickjacking disabled. XSS and NoSQL injection sanitizer
              scripts fully active.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
              <span>Sanitizer: Recursion active</span>
              <span>CORS: Allowed origins</span>
            </div>
          </div>
        </section>

        {/* API Explorer & Usage Code */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Gateway Endpoints</h2>
            <div className="space-y-3">
              {/* GET /api/health */}
              <Link
                href="/api/health"
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                    GET
                  </span>
                  <span className="text-sm font-mono text-zinc-300">/api/health</span>
                </div>
                <span className="text-xs text-zinc-500">Health Check & Diagnostic State</span>
              </Link>
            </div>
          </div>

          {/* Quick Query Box */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Quick Integration</h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 font-mono text-xs text-zinc-400 space-y-2 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[10px] text-zinc-600">JavaScript</div>
              <span className="text-zinc-600">{'// Fetch system health diagnostic report'}</span>
              <div>
                <span className="text-indigo-400">const</span> response ={' '}
                <span className="text-indigo-400">await</span>{' '}
                <span className="text-violet-400">fetch</span>(
                <span className="text-emerald-400">{"'/api/health'"}</span>);
              </div>
              <div>
                <span className="text-indigo-400">const</span> data ={' '}
                <span className="text-indigo-400">await</span> response.
                <span className="text-violet-400">json</span>();
              </div>
              <div>
                <span className="text-violet-400">console</span>.
                <span className="text-violet-400">log</span>(data);
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span>
            &copy; {new Date().getFullYear()} Multi-Vendor SaaS Platform. All rights reserved.
          </span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              API Services Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
