import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Dashboard } from '@/components/pages/Dashboard'
import { PageEditor } from '@/components/pages/PageEditor'
import { ProjectManager } from '@/components/pages/ProjectManager'
import { AuthForm } from '@/components/auth/AuthForm'
import { Toaster } from '@/components/ui/sonner'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type View = 'dashboard' | 'editor' | 'projects' | 'templates' | 'analytics' | 'settings'

export interface AppState {
  currentView: View
  selectedProjectId: string | null
  selectedPageId: string | null
  user: User | null
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'dashboard',
    selectedProjectId: null,
    selectedPageId: null,
    user: null
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAppState(prev => ({ ...prev, user: session?.user ?? null }))
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAppState(prev => ({ ...prev, user: session?.user ?? null }))
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }))
  }

  const navigateToView = (view: View, projectId?: string, pageId?: string) => {
    setAppState(prev => ({
      ...prev,
      currentView: view,
      selectedProjectId: projectId || prev.selectedProjectId,
      selectedPageId: pageId || prev.selectedPageId
    }))
  }

  const renderView = () => {
    switch (appState.currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateToView} />
      case 'editor':
        return (
          <PageEditor 
            projectId={appState.selectedProjectId}
            pageId={appState.selectedPageId}
            onNavigate={navigateToView}
          />
        )
      case 'projects':
        return <ProjectManager onNavigate={navigateToView} />
      case 'templates':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-muted-foreground">Browse and use pre-built templates</p>
            {/* TODO: Implement templates view */}
          </div>
        )
      case 'analytics':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your website performance</p>
            {/* TODO: Implement analytics view */}
          </div>
        )
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your CMS preferences</p>
            {/* TODO: Implement settings view */}
          </div>
        )
      default:
        return <Dashboard onNavigate={navigateToView} />
    }
  }

  if (!appState.user) {
    return <AuthForm />
  }

  return (
    <>
      <DashboardLayout 
        currentView={appState.currentView}
        onNavigate={navigateToView}
        selectedProjectId={appState.selectedProjectId}
      >
        {renderView()}
      </DashboardLayout>
      <Toaster />
    </>
  )
}

export default App