import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { fetchWorkflows, type Workflow } from '@/lib/api';

export function WorkflowList({ refreshKey }: { refreshKey?: number }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, [refreshKey]);

  const loadWorkflows = async () => {
    try {
      const data = await fetchWorkflows();
      setWorkflows(data);
    } catch (error) {
      toast.error('Could not load workflows');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'pending_extraction': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'pending_approval': return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const getTriggerIcon = (source: string | null) => {
    switch (source) {
      case 'email': return '📧';
      case 'webhook': return '🔗';
      case 'manual': return '✋';
      default: return '⚡';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <Card className="border-white/5 bg-background/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Pipeline Statuses</CardTitle>
      </CardHeader>
      <CardContent>
        {workflows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No workflows found. Use the Agent to generate one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payload</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((w) => (
                <TableRow key={w.id} className="group hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono text-xs">#{w.id.slice(-6)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <span>{getTriggerIcon(w.trigger_source)}</span>
                      <span className="capitalize">{w.trigger_source || 'unknown'}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" title={w.raw_input_text || ''}>
                    {w.raw_input_text || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(w.status)}>
                      {w.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {w.extracted_payload ? `${Object.keys(w.extracted_payload).length} fields` : '—'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(w.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
