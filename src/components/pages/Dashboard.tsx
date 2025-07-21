import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  FileText, 
  Globe, 
  TrendingUp, 
  Users, 
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase, type Project } from '@/lib/supabase'
import type { View } from '@/App'

interface DashboardProps {
  onNavigate: (view: View, projectId?: string, pageId?: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    publishedSites: 0,
    totalViews: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5)

      if (projectsError) throw projectsError

      // Load analytics for stats
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics')
        .select('*')

      if (analyticsError) throw analyticsError

      setProjects(projectsData || [])
      
      // Calculate stats
      const totalProjects = projectsData?.length || 0
      const publishedSites = projectsData?.filter(p => p.is_published).length || 0
      const totalViews = analyticsData?.length || 0

      setStats({
        totalProjects,
        publishedSites,
        totalViews,
        activeUsers: Math.floor(totalViews * 0.4) // Rough estimate
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const statsConfig = [
    {
      title: "Total Projects",
      value: stats.totalProjects.toString(),
      change: "+2 this month",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Published Sites",
      value: stats.publishedSites.toString(),
      change: "+1 this week",
      icon: Globe,
      color: "text-green-600"
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      change: "+12% from last month",
      icon: Eye,
      color: "text-purple-600"
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      change: "+5% from last week",
      icon: Users,
      color: "text-orange-600"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>
        <Button className="gap-2" onClick={() => onNavigate('projects')}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Your latest projects and their status
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('projects')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-muted rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-48"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to get started.
              </p>
              <Button onClick={() => onNavigate('projects')} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={project.is_published ? 'default' : 'secondary'}
                        >
                          {project.is_published ? 'published' : 'draft'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onNavigate('editor', project.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate('editor', project.id)}>
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Site</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Settings</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigate('projects')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Project
            </CardTitle>
            <CardDescription>
              Start a new website or blog from scratch
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigate('templates')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Browse Templates
            </CardTitle>
            <CardDescription>
              Choose from our collection of pre-built templates
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigate('analytics')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              View Analytics
            </CardTitle>
            <CardDescription>
              Check your site performance and visitor stats
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}