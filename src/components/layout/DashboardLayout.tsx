import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'
import type { View } from '@/App'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentView: View
  onNavigate: (view: View, projectId?: string, pageId?: string) => void
  selectedProjectId: string | null
}

export function DashboardLayout({ 
  children, 
  currentView, 
  onNavigate, 
  selectedProjectId 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className="flex">
        <Sidebar 
          open={sidebarOpen} 
          onOpenChange={setSidebarOpen}
          currentView={currentView}
          onNavigate={onNavigate}
          selectedProjectId={selectedProjectId}
        />
        
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-16"
        )}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}