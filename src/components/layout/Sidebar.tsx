import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  FolderOpen,
  FileText,
  Plus,
  ChevronRight,
  ChevronDown,
  Home,
  Layout,
  Settings,
  BarChart3,
  Palette,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase, type Project, type Page } from '@/lib/supabase'
import type { View } from '@/App'

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentView: View
  onNavigate: (view: View, projectId?: string, pageId?: string) => void
  selectedProjectId: string | null
}

export function Sidebar({ open, currentView, onNavigate, selectedProjectId }: SidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectPages, setProjectPages] = useState<Record<string, Page[]>>({})

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])

      // Load pages for each project
      if (data && data.length > 0) {
        const pagesPromises = data.map(async (project) => {
          const { data: pages, error: pagesError } = await supabase
            .from('pages')
            .select('*')
            .eq('project_id', project.id)
            .order('order_index', { ascending: true })

          if (pagesError) throw pagesError
          return { projectId: project.id, pages: pages || [] }
        })

        const pagesResults = await Promise.all(pagesPromises)
        const pagesMap = pagesResults.reduce((acc, { projectId, pages }) => {
          acc[projectId] = pages
          return acc
        }, {} as Record<string, Page[]>)

        setProjectPages(pagesMap)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId && !expandedProjects.includes(selectedProjectId)) {
      setExpandedProjects(prev => [...prev, selectedProjectId])
    }
  }, [selectedProjectId, expandedProjects])

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 ease-in-out z-40",
      open ? "w-64" : "w-16"
    )}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          {open ? (
            <Button 
              className="w-full gap-2" 
              size="sm"
              onClick={() => onNavigate('projects')}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          ) : (
            <Button 
              size="sm" 
              className="w-full p-2"
              onClick={() => onNavigate('projects')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Main Navigation */}
            <div className="space-y-1 mb-6">
              {sidebarItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    !open && "px-2"
                  )}
                  onClick={() => onNavigate(item.id as View)}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {open && <span>{item.label}</span>}
                </Button>
              ))}
            </div>

            {/* Projects Section */}
            {open && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Projects</h3>
                </div>
                
                {projects.map((project) => (
                  <div key={project.id} className="space-y-1">
                    <Button
                      variant={selectedProjectId === project.id ? "secondary" : "ghost"}
                      className="w-full justify-between p-2 h-auto"
                      onClick={() => toggleProject(project.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span className="text-sm truncate">{project.name}</span>
                      </div>
                      {expandedProjects.includes(project.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                    
                    {expandedProjects.includes(project.id) && (
                      <div className="ml-6 space-y-1">
                        {(projectPages[project.id] || []).map((page) => (
                          <Button
                            key={page.id}
                            variant="ghost"
                            className="w-full justify-start gap-2 p-2 h-auto text-sm"
                            onClick={() => onNavigate('editor', project.id, page.id)}
                          >
                            <FileText className="h-3 w-3" />
                            <span className="truncate">{page.title}</span>
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 p-2 h-auto text-sm text-muted-foreground"
                          onClick={() => onNavigate('editor', project.id)}
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Page</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                {projects.length === 0 && (
                  <div className="px-2 py-4 text-center">
                    <p className="text-xs text-muted-foreground mb-2">No projects yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => onNavigate('projects')}
                    >
                      Create Project
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-border">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                !open && "px-2"
              )}
            >
              <Palette className="h-4 w-4 flex-shrink-0" />
              {open && <span>Themes</span>}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                !open && "px-2"
              )}
            >
              <Globe className="h-4 w-4 flex-shrink-0" />
              {open && (
                <div className="flex items-center justify-between w-full">
                  <span>Publish</span>
                  <Badge variant="secondary" className="text-xs">Live</Badge>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}