import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Code2, Search, Copy, Pencil, Trash2, MoreVertical, Check } from 'lucide-react';
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
import { collections, Snippet } from '@/lib/mongodb';
import { toast } from 'sonner';

const languages = [
  'javascript',
  'typescript',
  'python',
  'bash',
  'sql',
  'html',
  'css',
  'json',
  'markdown',
  'other',
];

export default function SnippetsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    language: 'javascript',
    code: '',
    description: '',
    tags: '',
  });

  const { data: snippets = [], isLoading } = useMongoFind<Snippet>(
    collections.snippets,
    {},
    { sort: { updatedAt: -1 } }
  );

  const insertMutation = useMongoInsert<Snippet>(collections.snippets);
  const updateMutation = useMongoUpdate<Snippet>(collections.snippets);
  const deleteMutation = useMongoDelete(collections.snippets);

  const filteredSnippets = snippets.filter(
    (snippet) =>
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openNewDialog = () => {
    setEditingSnippet(null);
    setFormData({ title: '', language: 'javascript', code: '', description: '', tags: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setFormData({
      title: snippet.title,
      language: snippet.language,
      code: snippet.code,
      description: snippet.description || '',
      tags: snippet.tags.join(', '),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.code.trim()) {
      toast.error('Title and code are required');
      return;
    }

    const snippetData = {
      title: formData.title.trim(),
      language: formData.language,
      code: formData.code,
      description: formData.description.trim() || undefined,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    try {
      if (editingSnippet) {
        await updateMutation.mutateAsync({ id: editingSnippet._id!, update: snippetData });
        toast.success('Snippet updated');
      } else {
        await insertMutation.mutateAsync(snippetData);
        toast.success('Snippet created');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save snippet');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Snippet deleted');
    } catch (error) {
      toast.error('Failed to delete snippet');
    }
  };

  const handleCopy = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Snippets</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Store and organize reusable code snippets
            </p>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Snippet
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="pl-10"
          />
        </div>

        {/* Snippets List */}
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : filteredSnippets.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <Code2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No snippets match your search' : 'No snippets yet'}
              </p>
              {!searchQuery && (
                <Button onClick={openNewDialog}>Create your first snippet</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSnippets.map((snippet, index) => (
              <motion.div
                key={snippet._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:bg-accent/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{snippet.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {snippet.language}
                          </Badge>
                        </div>
                        {snippet.description && (
                          <p className="text-sm text-muted-foreground">
                            {snippet.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(snippet._id!, snippet.code)}
                        >
                          {copiedId === snippet._id ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(snippet)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(snippet._id!)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <pre className="text-sm font-mono bg-secondary p-4 rounded-lg overflow-x-auto max-h-[200px]">
                      <code>{snippet.code}</code>
                    </pre>

                    {snippet.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {snippet.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSnippet ? 'Edit Snippet' : 'New Snippet'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Snippet title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Language</label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Code</label>
                <Textarea
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Paste your code here..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description (optional)"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="utility, helper, react"
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={insertMutation.isPending || updateMutation.isPending}
              >
                {editingSnippet ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
