import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMongoFind, useMongoInsert, useMongoUpdate } from '@/hooks/useMongoDB';
import { collections, DailyLog, Project } from '@/lib/mongodb';
import { toast } from 'sonner';

export default function DailyLogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    projectId: '',
    workCompleted: '',
    blockers: '',
    nextSteps: '',
  });

  const { data: logs = [], isLoading: loadingLogs, refetch } = useMongoFind<DailyLog>(
    collections.dailyLogs,
    { date: dateString }
  );

  const { data: projects = [] } = useMongoFind<Project>(
    collections.projects,
    { status: 'active' }
  );

  const insertMutation = useMongoInsert<DailyLog>(collections.dailyLogs);
  const updateMutation = useMongoUpdate<DailyLog>(collections.dailyLogs);

  const currentLog = logs[0];

  // Sync form data when log changes
  useState(() => {
    if (currentLog) {
      setFormData({
        projectId: currentLog.projectId || '',
        workCompleted: currentLog.workCompleted,
        blockers: currentLog.blockers,
        nextSteps: currentLog.nextSteps,
      });
    } else {
      setFormData({ projectId: '', workCompleted: '', blockers: '', nextSteps: '' });
    }
  });

  const handleSave = async () => {
    const logData = {
      date: dateString,
      projectId: formData.projectId || undefined,
      workCompleted: formData.workCompleted,
      blockers: formData.blockers,
      nextSteps: formData.nextSteps,
    };

    try {
      if (currentLog) {
        await updateMutation.mutateAsync({ id: currentLog._id!, update: logData });
      } else {
        await insertMutation.mutateAsync(logData);
      }
      toast.success('Log saved');
      refetch();
    } catch (error) {
      toast.error('Failed to save log');
    }
  };

  const goToToday = () => setSelectedDate(new Date());
  const goPrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Daily Log</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track your daily progress and blockers
            </p>
          </div>
        </div>

        {/* Date Navigation */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goPrevDay}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
                {!isToday && (
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={goNextDay}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Log Form */}
        {loadingLogs ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <motion.div
            key={dateString}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Project Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
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
              </CardContent>
            </Card>

            {/* Work Completed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Work Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.workCompleted}
                  onChange={(e) => setFormData({ ...formData, workCompleted: e.target.value })}
                  placeholder="What did you accomplish today?"
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Blockers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Blockers / Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.blockers}
                  onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                  placeholder="Any blockers or challenges?"
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.nextSteps}
                  onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                  placeholder="What's planned for tomorrow?"
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={insertMutation.isPending || updateMutation.isPending}
              className="w-full"
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {currentLog ? 'Update Log' : 'Save Log'}
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
