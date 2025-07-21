import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  FileText, 
  Globe, 
  Eye,
  Edit,
  MoreHorizontal,
  Trash2,
  Copy,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase, type Project } from '@/lib/supabase'
import { toast } from 'sonner'
import type { View } from '@/App'

interface ProjectManagerProps {
  onNavigate: (view: View, projectId?: string, pageId?: string) => void
}

export function ProjectManager({ onNavigate }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    subdomain: ''
  })
  const [editProject, setEditProject] = useState({
    name: '',
    description: '',
    subdomain: ''
  })

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          description: newProject.description,
          subdomain: newProject.subdomain || null,
          user_id: user.id,
          is_published: false
        })
        .select()
        .single()

      if (error) throw error

      // Create a default home page for the new project
      await supabase
        .from('pages')
        .insert({
          project_id: data.id,
          title: 'Home',
          slug: 'home',
          content: `# Welcome to ${newProject.name}\n\nThis is your homepage. Start editing to create amazing content!`,
          meta_description: `Welcome to ${newProject.name}`,
          is_published: false,
          order_index: 0
        })

      setProjects(prev => [data, ...prev])
      setShowNewProjectDialog(false)
      setNewProject({ name: '', description: '', subdomain: '' })
      toast.success('Project created successfully!')
      
      // Navigate to the editor for the new project
      onNavigate('editor', data.id)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== projectId))
      toast.success('Project deleted successfully')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const openEditProject = (project: Project) => {
    setEditingProject(project)
    setEditProject({
      name: project.name,
      description: project.description || '',
      subdomain: project.subdomain || ''
    })
    setShowEditProjectDialog(true)
  }

  const updateProject = async () => {
    if (!editingProject || !editProject.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: editProject.name,
          description: editProject.description,
          subdomain: editProject.subdomain || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProject.id)
        .select()
        .single()

      if (error) throw error

      setProjects(prev => prev.map(p => p.id === editingProject.id ? data : p))
      setShowEditProjectDialog(false)
      setEditingProject(null)
      setEditProject({ name: '', description: '', subdomain: '' })
      toast.success('Project updated successfully!')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    }
  }

  const duplicateProject = async (project: Project) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: `${project.name} (Copy)`,
          description: project.description,
          user_id: user.id,
          is_published: false,
          theme_settings: project.theme_settings
        })
        .select()
        .single()

      if (projectError) throw projectError

      // Copy all pages from the original project
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', project.id)

      if (pagesError) throw pagesError

      if (pages && pages.length > 0) {
        const newPages = pages.map(page => ({
          project_id: newProject.id,
          title: page.title,
          slug: page.slug,
          content: page.content,
          meta_description: page.meta_description,
          meta_keywords: page.meta_keywords,
          is_published: false,
          order_index: page.order_index,
          parent_id: page.parent_id
        }))

        const { error: insertError } = await supabase
          .from('pages')
          .insert(newPages)

        if (insertError) throw insertError
      }

      setProjects(prev => [newProject, ...prev])
      toast.success('Project duplicated successfully!')
    } catch (error) {
      console.error('Error duplicating project:', error)
      toast.error('Failed to duplicate project')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage all your website projects
          </p>
        </div>
        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a new website project. You can always change these settings later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Awesome Website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of your project"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={newProject.subdomain}
                    onChange={(e) => setNewProject(prev => ({ ...prev, subdomain: e.target.value }))}
                    placeholder="my-site"
                  />
                  <span className="text-sm text-muted-foreground">.yoursite.com</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createProject}>
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={showEditProjectDialog} onOpenChange={setShowEditProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editProject.name}
                onChange={(e) => setEditProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Website"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editProject.description}
                onChange={(e) => setEditProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A brief description of your project"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subdomain">Subdomain (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-subdomain"
                  value={editProject.subdomain}
                  onChange={(e) => setEditProject(prev => ({ ...prev, subdomain: e.target.value }))}
                  placeholder="my-site"
                />
                <span className="text-sm text-muted-foreground">.yoursite.com</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditProjectDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateProject}>
                Update Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to get started with building your website.
            </p>
            <Button onClick={() => setShowNewProjectDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.description || 'No description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onNavigate('editor', project.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateProject(project)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditProject(project)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteProject(project.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={project.is_published ? "default" : "secondary"}>
                    {project.is_published ? "Published" : "Draft"}
                  </Badge>
                  {project.subdomain && (
                    <span className="text-sm text-muted-foreground">
                      {project.subdomain}.yoursite.com
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => onNavigate('editor', project.id)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  {project.is_published && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Publish
                  </Button>
                </div>
                
                <div className="mt-3 text-xs text-muted-foreground">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}