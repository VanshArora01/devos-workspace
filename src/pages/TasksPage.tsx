import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckSquare, Circle, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMongoFind, useMongoInsert, useMongoUpdate, useMongoDelete } from '@/hooks/useMongoDB';
import { collections, Task, Project } from '@/lib/mongodb';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig = {
  todo: { icon: Circle, label: 'Todo', color: 'text-muted-foreground' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'text-info' },
  done: { icon: CheckCircle2, label: 'Done', color: 'text-success' },
};

export default function TasksPage() {
  const [newTask, setNewTask] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  const { data: tasks = [], isLoading } = useMongoFind<Task>(
    collections.tasks,
    {},
    { sort: { createdAt: -1 } }
  );

  const { data: projects = [] } = useMongoFind<Project>(collections.projects);

  const insertMutation = useMongoInsert<Task>(collections.tasks);
  const updateMutation = useMongoUpdate<Task>(collections.tasks);
  const deleteMutation = useMongoDelete(collections.tasks);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    try {
      await insertMutation.mutateAsync({
        title: newTask.trim(),
        status: 'todo',
        projectId: newTaskProject || undefined,
      });
      setNewTask('');
      setNewTaskProject('');
      toast.success('Task added');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await updateMutation.mutateAsync({ id: taskId, update: { status } });
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteMutation.mutateAsync(taskId);
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find(p => p._id === projectId)?.name;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your todos and work in progress
          </p>
        </div>

        {/* Add Task */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1"
              />
              <Select value={newTaskProject} onValueChange={setNewTaskProject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id!}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddTask} disabled={insertMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All' : statusConfig[status].label}
            </Button>
          ))}
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : filteredTasks.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <CheckSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No tasks yet' : `No ${filter.replace('_', ' ')} tasks`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task, index) => {
              const StatusIcon = statusConfig[task.status].icon;
              const projectName = getProjectName(task.projectId);

              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="hover:bg-accent/30 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <Select
                          value={task.status}
                          onValueChange={(value: Task['status']) =>
                            handleStatusChange(task._id!, value)
                          }
                        >
                          <SelectTrigger className="w-auto border-0 p-0 h-auto focus:ring-0">
                            <StatusIcon
                              className={cn(
                                'w-5 h-5',
                                statusConfig[task.status].color
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([value, config]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <config.icon className={cn('w-4 h-4', config.color)} />
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium',
                              task.status === 'done' && 'line-through text-muted-foreground'
                            )}
                          >
                            {task.title}
                          </p>
                          {projectName && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {projectName}
                            </p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(task._id!)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
