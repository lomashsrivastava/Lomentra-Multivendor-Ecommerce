import { useState, type ReactNode } from 'react'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'

interface StorefrontLayoutProps {
  children: ReactNode
  currentView: string
  onViewChange: (view: string) => void
  onOpenAuthModal: () => void
  onOpenWishlist?: () => void
}

export function StorefrontLayout({
  children,
  currentView,
  onViewChange,
  onOpenAuthModal,
  onOpenWishlist,
}: StorefrontLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onViewChange={onViewChange}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          currentView={currentView}
          onViewChange={onViewChange}
          onOpenAuthModal={onOpenAuthModal}
          onOpenWishlist={onOpenWishlist}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full mx-auto relative z-10">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-6 px-4 md:px-6 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>&copy; 2026 <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent font-black">Lomentra</span> — <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-semibold">Powering Digital Commerce.</span></span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />All Systems Operational</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
