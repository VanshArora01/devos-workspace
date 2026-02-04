import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, ExternalLink, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useMongoFind, useMongoInsert, useMongoUpdate, useMongoDelete } from '@/hooks/useMongoDB';
import { collections, Project } from '@/lib/mongodb';
import { toast } from 'sonner';

const statusColors = {
  active: 'bg-success/20 text-success border-success/30',
  paused: 'bg-warning/20 text-warning border-warning/30',
  completed: 'bg-muted text-muted-foreground border-border',
};

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'paused' | 'completed',
    techStack: '',
    repositoryUrl: '',
  });

  const { data: projects = [], isLoading } = useMongoFind<Project>(
    collections.projects,
    {},
    { sort: { updatedAt: -1 } }
  );

  const insertMutation = useMongoInsert<Project>(collections.projects);
  const updateMutation = useMongoUpdate<Project>(collections.projects);
  const deleteMutation = useMongoDelete(collections.projects);

  const openNewDialog = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '', status: 'active', techStack: '', repositoryUrl: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      techStack: project.techStack.join(', '),
      repositoryUrl: project.repositoryUrl || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const projectData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      techStack: formData.techStack.split(',').map(t => t.trim()).filter(Boolean),
      repositoryUrl: formData.repositoryUrl.trim() || undefined,
    };

    try {
      if (editingProject) {
        await updateMutation.mutateAsync({ id: editingProject._id!, update: projectData });
        toast.success('Project updated');
      } else {
        await insertMutation.mutateAsync(projectData);
        toast.success('Project created');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your development projects
            </p>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : projects.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <FolderKanban className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={openNewDialog}>Create your first project</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:bg-accent/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 -mr-2">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(project)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(project._id!)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.techStack.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {project.techStack.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.techStack.length - 4}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={statusColors[project.status]}>
                        {project.status}
                      </Badge>
                      {project.repositoryUrl && (
                        <a
                          href={project.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'New Project'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Awesome Project"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the project"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'paused' | 'completed') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tech Stack</label>
                <Input
                  value={formData.techStack}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  placeholder="React, TypeScript, Node.js"
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Repository URL</label>
                <Input
                  value={formData.repositoryUrl}
                  onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={insertMutation.isPending || updateMutation.isPending}>
                {editingProject ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
