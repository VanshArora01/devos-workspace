import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { FolderKanban, Calendar, CheckSquare, AlertCircle, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useMongoFind } from '@/hooks/useMongoDB';
import { collections, Project, DailyLog, Task } from '@/lib/mongodb';

export default function DashboardPage() {
  const { user } = useUser();
  
  const { data: projects = [], isLoading: loadingProjects } = useMongoFind<Project>(
    collections.projects,
    {},
    { sort: { updatedAt: -1 }, limit: 5 }
  );

  const today = new Date().toISOString().split('T')[0];
  const { data: todayLogs = [] } = useMongoFind<DailyLog>(
    collections.dailyLogs,
    { date: today }
  );

  const { data: tasks = [], isLoading: loadingTasks } = useMongoFind<Task>(
    collections.tasks,
    { status: { $ne: 'done' } },
    { sort: { createdAt: -1 }, limit: 10 }
  );

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const hasLoggedToday = todayLogs.length > 0;

  const stats = [
    {
      title: 'Active Projects',
      value: activeProjects,
      icon: FolderKanban,
      href: '/projects',
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      icon: TrendingUp,
      href: '/tasks',
    },
    {
      title: 'Todo Tasks',
      value: todoTasks,
      icon: CheckSquare,
      href: '/tasks',
    },
    {
      title: "Today's Log",
      value: hasLoggedToday ? '✓' : '—',
      icon: Calendar,
      href: '/daily-log',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold"
          >
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your workspace
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={stat.href}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <stat.icon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        {!hasLoggedToday && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <span className="text-sm">You haven't logged your work today</span>
                </div>
                <Link to="/daily-log">
                  <Button size="sm">Log Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Recent Projects</CardTitle>
              <Link to="/projects">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingProjects ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No projects yet.{' '}
                  <Link to="/projects" className="text-foreground underline">
                    Create one
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <div
                      key={project._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {project.description}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          project.status === 'active'
                            ? 'bg-success/20 text-success'
                            : project.status === 'paused'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Current Tasks</CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : tasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No tasks yet.{' '}
                  <Link to="/tasks" className="text-foreground underline">
                    Create one
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <p className="font-medium text-sm">{task.title}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          task.status === 'in_progress'
                            ? 'bg-info/20 text-info'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
