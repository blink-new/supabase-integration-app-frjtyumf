import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarkdownEditor } from '@/components/editor/MarkdownEditor'
import { 
  Save, 
  Eye, 
  Settings, 
  Globe,
  ArrowLeft,
  MoreHorizontal,
  Plus,
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase, type Project, type Page } from '@/lib/supabase'
import { toast } from 'sonner'
import type { View } from '@/App'

interface PageEditorProps {
  projectId: string | null
  pageId: string | null
  onNavigate: (view: View, projectId?: string, pageId?: string) => void
}

export function PageEditor({ projectId, pageId, onNavigate }: PageEditorProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [currentPage, setCurrentPage] = useState<Page | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showNewPageDialog, setShowNewPageDialog] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')

  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    content: '',
    metaDescription: '',
    metaKeywords: '',
    isPublished: false
  })

  const loadProject = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)

      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Load project pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (pagesError) throw pagesError
      setPages(pagesData || [])

    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId, loadProject])

  useEffect(() => {
    if (pageId && pages.length > 0) {
      const page = pages.find(p => p.id === pageId)
      if (page) {
        setCurrentPage(page)
        setPageData({
          title: page.title,
          slug: page.slug,
          content: page.content || '',
          metaDescription: page.meta_description || '',
          metaKeywords: page.meta_keywords || '',
          isPublished: page.is_published || false
        })
      }
    } else if (pages.length > 0 && !pageId) {
      // Select first page if no specific page is selected
      const firstPage = pages[0]
      setCurrentPage(firstPage)
      setPageData({
        title: firstPage.title,
        slug: firstPage.slug,
        content: firstPage.content || '',
        metaDescription: firstPage.meta_description || '',
        metaKeywords: firstPage.meta_keywords || '',
        isPublished: firstPage.is_published || false
      })
      // Update URL to reflect the selected page
      onNavigate('editor', projectId, firstPage.id)
    }
  }, [pageId, pages, projectId, onNavigate])

  const handleSave = async () => {
    if (!currentPage || !projectId) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('pages')
        .update({
          title: pageData.title,
          slug: pageData.slug,
          content: pageData.content,
          meta_description: pageData.metaDescription,
          meta_keywords: pageData.metaKeywords,
          is_published: pageData.isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPage.id)

      if (error) throw error

      // Update local state
      setPages(prev => prev.map(p => 
        p.id === currentPage.id 
          ? { ...p, ...pageData, meta_description: pageData.metaDescription, meta_keywords: pageData.metaKeywords, is_published: pageData.isPublished }
          : p
      ))

      toast.success('Page saved successfully!')
    } catch (error) {
      console.error('Error saving page:', error)
      toast.error('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    const newPublishState = !pageData.isPublished
    setPageData(prev => ({ ...prev, isPublished: newPublishState }))
    
    // Auto-save when publishing/unpublishing
    setTimeout(handleSave, 100)
  }

  const createNewPage = async () => {
    if (!projectId || !newPageTitle.trim()) return

    try {
      const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const orderIndex = pages.length

      const { data, error } = await supabase
        .from('pages')
        .insert({
          project_id: projectId,
          title: newPageTitle,
          slug,
          content: `# ${newPageTitle}\n\nStart writing your content here...`,
          meta_description: `${newPageTitle} page`,
          is_published: false,
          order_index: orderIndex
        })
        .select()
        .single()

      if (error) throw error

      setPages(prev => [...prev, data])
      setShowNewPageDialog(false)
      setNewPageTitle('')
      toast.success('Page created successfully!')
      
      // Navigate to the new page
      onNavigate('editor', projectId, data.id)
    } catch (error) {
      console.error('Error creating page:', error)
      toast.error('Failed to create page')
    }
  }

  const deletePage = async (pageToDelete: Page) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the last page')
      return
    }

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageToDelete.id)

      if (error) throw error

      const updatedPages = pages.filter(p => p.id !== pageToDelete.id)
      setPages(updatedPages)
      
      // If we deleted the current page, navigate to the first remaining page
      if (currentPage?.id === pageToDelete.id && updatedPages.length > 0) {
        onNavigate('editor', projectId, updatedPages[0].id)
      }

      toast.success('Page deleted successfully')
    } catch (error) {
      console.error('Error deleting page:', error)
      toast.error('Failed to delete page')
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Project not found</h3>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
          <Button onClick={() => onNavigate('projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">No pages yet</h3>
          <p className="text-muted-foreground">Create your first page to start editing.</p>
          <Dialog open={showNewPageDialog} onOpenChange={setShowNewPageDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Page</DialogTitle>
                <DialogDescription>
                  Add a new page to your project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="page-title">Page Title</Label>
                  <Input
                    id="page-title"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="About Us"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewPageDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewPage}>
                    Create Page
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  if (!currentPage) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={() => onNavigate('projects')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{pageData.title}</h1>
            <p className="text-sm text-muted-foreground">
              {project.name} • /{pageData.slug}
            </p>
          </div>
          <Badge variant={pageData.isPublished ? "default" : "secondary"}>
            {pageData.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showNewPageDialog} onOpenChange={setShowNewPageDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Page</DialogTitle>
                <DialogDescription>
                  Add a new page to your project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="page-title">Page Title</Label>
                  <Input
                    id="page-title"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="About Us"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewPageDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewPage}>
                    Create Page
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button 
            variant={pageData.isPublished ? "secondary" : "default"} 
            size="sm" 
            className="gap-2"
            onClick={handlePublish}
          >
            <Globe className="h-4 w-4" />
            {pageData.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button 
            size="sm" 
            className="gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Duplicate Page</DropdownMenuItem>
              <DropdownMenuItem>View History</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => deletePage(currentPage)}
              >
                Delete Page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="content" className="flex-1 flex flex-col">
            <div className="px-6 pt-4">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="flex-1 p-6 m-0">
              <MarkdownEditor
                content={pageData.content}
                onChange={(content) => setPageData(prev => ({ ...prev, content }))}
                onSave={handleSave}
                className="h-full"
              />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-6 m-0">
              <div className="max-w-2xl space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Page Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Page Title</Label>
                      <Input
                        id="title"
                        value={pageData.title}
                        onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">yoursite.com/</span>
                        <Input
                          id="slug"
                          value={pageData.slug}
                          onChange={(e) => setPageData(prev => ({ ...prev, slug: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta-description">Meta Description</Label>
                      <Textarea
                        id="meta-description"
                        value={pageData.metaDescription}
                        onChange={(e) => setPageData(prev => ({ ...prev, metaDescription: e.target.value }))}
                        placeholder="A brief description of this page for search engines"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {pageData.metaDescription.length}/160 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta-keywords">Meta Keywords</Label>
                      <Input
                        id="meta-keywords"
                        value={pageData.metaKeywords}
                        onChange={(e) => setPageData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="gap-2" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Sidebar */}
        <div className="w-80 border-l border-border bg-muted/30">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Live Preview</h3>
            <p className="text-sm text-muted-foreground">
              See how your page looks to visitors
            </p>
          </div>
          <div className="p-4">
            <div className="bg-card rounded-lg border border-border p-4 min-h-96">
              <div className="prose prose-sm max-w-none">
                <h1 className="text-lg font-bold mb-2">{pageData.title}</h1>
                <div className="text-sm text-muted-foreground">
                  This is a simplified preview. Use the Preview button for full view.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}