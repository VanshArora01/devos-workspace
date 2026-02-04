import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap, Play, Save, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMongoFind, useMongoInsert, useMongoUpdate, useMongoDelete } from '@/hooks/useMongoDB';
import { collections, ApiRequest } from '@/lib/mongodb';
import { toast } from 'sonner';

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const methodColors: Record<string, string> = {
  GET: 'bg-success/20 text-success',
  POST: 'bg-info/20 text-info',
  PUT: 'bg-warning/20 text-warning',
  DELETE: 'bg-destructive/20 text-destructive',
  PATCH: 'bg-purple-500/20 text-purple-500',
};

export default function ApiTesterPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState<{ status: number; data: string; time: number } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    method: 'GET' as ApiRequest['method'],
    url: '',
    headers: '{\n  "Content-Type": "application/json"\n}',
    body: '',
  });

  const { data: requests = [], isLoading } = useMongoFind<ApiRequest>(
    collections.apiRequests,
    {},
    { sort: { updatedAt: -1 } }
  );

  const insertMutation = useMongoInsert<ApiRequest>(collections.apiRequests);
  const updateMutation = useMongoUpdate<ApiRequest>(collections.apiRequests);
  const deleteMutation = useMongoDelete(collections.apiRequests);

  const openNewDialog = () => {
    setSelectedRequest(null);
    setFormData({
      name: '',
      method: 'GET',
      url: '',
      headers: '{\n  "Content-Type": "application/json"\n}',
      body: '',
    });
    setResponse(null);
    setDialogOpen(true);
  };

  const openRequest = (request: ApiRequest) => {
    setSelectedRequest(request);
    setFormData({
      name: request.name,
      method: request.method,
      url: request.url,
      headers: JSON.stringify(request.headers, null, 2),
      body: request.body || '',
    });
    setResponse(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(formData.headers || '{}');
    } catch {
      toast.error('Invalid headers JSON');
      return;
    }

    const requestData = {
      name: formData.name.trim(),
      method: formData.method,
      url: formData.url.trim(),
      headers,
      body: formData.body || undefined,
    };

    try {
      if (selectedRequest) {
        await updateMutation.mutateAsync({ id: selectedRequest._id!, update: requestData });
        toast.success('Request updated');
      } else {
        await insertMutation.mutateAsync(requestData);
        toast.success('Request saved');
      }
    } catch (error) {
      toast.error('Failed to save request');
    }
  };

  const handleExecute = async () => {
    if (!formData.url.trim()) {
      toast.error('URL is required');
      return;
    }

    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(formData.headers || '{}');
    } catch {
      toast.error('Invalid headers JSON');
      return;
    }

    setIsExecuting(true);
    setResponse(null);

    const startTime = Date.now();

    try {
      const res = await fetch(formData.url, {
        method: formData.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(formData.method) ? formData.body : undefined,
      });

      const time = Date.now() - startTime;
      const text = await res.text();

      let formattedData = text;
      try {
        formattedData = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Keep as plain text
      }

      setResponse({ status: res.status, data: formattedData, time });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      setResponse({ status: 0, data: message, time: Date.now() - startTime });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Request deleted');
    } catch (error) {
      toast.error('Failed to delete request');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">API Tester</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Save and execute API requests
            </p>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Saved Requests */}
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : requests.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <Zap className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No saved requests</p>
              <Button onClick={openNewDialog}>Create your first request</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {requests.map((request, index) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className="hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => openRequest(request)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Badge className={methodColors[request.method]}>
                        {request.method}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{request.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {request.url}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(request._id!);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Request Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRequest ? 'Edit Request' : 'New Request'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My API Request"
                />
              </div>

              {/* Method & URL */}
              <div className="flex gap-3">
                <Select
                  value={formData.method}
                  onValueChange={(value: ApiRequest['method']) =>
                    setFormData({ ...formData, method: value })
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {httpMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={handleExecute} disabled={isExecuting}>
                  {isExecuting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Headers & Body */}
              <Tabs defaultValue="headers">
                <TabsList>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                </TabsList>
                <TabsContent value="headers">
                  <Textarea
                    value={formData.headers}
                    onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                    placeholder='{"Content-Type": "application/json"}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="body">
                  <Textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                </TabsContent>
              </Tabs>

              {/* Response */}
              {response && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-3">
                      <span
                        className={
                          response.status >= 200 && response.status < 300
                            ? 'text-success'
                            : response.status >= 400
                            ? 'text-destructive'
                            : 'text-warning'
                        }
                      >
                        {response.status || 'Error'}
                      </span>
                      <span className="text-muted-foreground font-normal">
                        {response.time}ms
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm font-mono bg-secondary p-4 rounded-lg overflow-auto max-h-[300px]">
                      {response.data}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={handleSave}
                disabled={insertMutation.isPending || updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
