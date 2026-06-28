import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { supabase, type Workflow } from '@/lib/supabase';
import { updateWorkflowStatus, updateWorkflowPayload } from '@/lib/api';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export function PendingApprovals({ refreshKey }: { refreshKey?: number }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state for editing
  const [editPayload, setEditPayload] = useState({
    clientName: '',
    projectScope: '',
    estimatedHours: '',
    proposedBudget: ''
  });

  useEffect(() => {
    loadPendingWorkflows();
  }, [refreshKey]);

  const loadPendingWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    const payload = workflow.extracted_payload || {};
    setEditPayload({
      clientName: payload.clientName || '',
      projectScope: payload.projectScope || '',
      estimatedHours: payload.estimatedHours || '',
      proposedBudget: payload.proposedBudget || ''
    });
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedWorkflow) return;
    setIsProcessing(true);

    try {
      // 1. Update payload with manual adjustments
      await updateWorkflowPayload(selectedWorkflow.id, editPayload, {
        steps: [
          ...(Array.isArray(selectedWorkflow.agent_logs?.steps) ? selectedWorkflow.agent_logs.steps : []),
          { action: 'manual_adjustments_saved', timestamp: new Date().toISOString() }
        ]
      });

      // 2. Update status to approved
      await updateWorkflowStatus(selectedWorkflow.id, 'approved', {
        steps: [
          ...(Array.isArray(selectedWorkflow.agent_logs?.steps) ? selectedWorkflow.agent_logs.steps : []),
          { action: 'approved_by_human', timestamp: new Date().toISOString() }
        ]
      });

      toast.success('Workflow approved! Firing off external tools...');

      // 3. Mock external tool simulation script
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Update status to completed
      await updateWorkflowStatus(selectedWorkflow.id, 'completed', {
        steps: [
          ...(Array.isArray(selectedWorkflow.agent_logs?.steps) ? selectedWorkflow.agent_logs.steps : []),
          { action: 'external_tool_simulation_completed', timestamp: new Date().toISOString() },
          { action: 'workflow_finalized', timestamp: new Date().toISOString() }
        ]
      });

      toast.success('Workflow completed successfully');
      setIsModalOpen(false);
      loadPendingWorkflows();
    } catch (error) {
      toast.error('Failed to process approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWorkflow) return;
    setIsProcessing(true);

    try {
      await updateWorkflowStatus(selectedWorkflow.id, 'rejected', {
        steps: [
          ...(Array.isArray(selectedWorkflow.agent_logs?.steps) ? selectedWorkflow.agent_logs.steps : []),
          { action: 'rejected_by_human', timestamp: new Date().toISOString() }
        ]
      });

      toast.info('Workflow rejected');
      setIsModalOpen(false);
      loadPendingWorkflows();
    } catch (error) {
      toast.error('Failed to reject workflow');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {workflows.length === 0 ? (
        <Card className="bg-background/50 backdrop-blur-sm border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">No pending approvals found at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card 
              key={workflow.id} 
              className="group hover:shadow-xl transition-all cursor-pointer border-primary/10 hover:border-primary/30 bg-background/50 backdrop-blur-sm"
              onClick={() => handleOpenModal(workflow)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 capitalize">
                    {workflow.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">
                    ID: {workflow.id.slice(-6)}
                  </span>
                </div>
                <CardTitle className="text-lg truncate">
                  {workflow.extracted_payload?.clientName || 'Unnamed Project'}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {workflow.raw_input_text}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </span>
                  <span className="capitalize font-medium text-primary/80">
                    Source: {workflow.trigger_source}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              Workflow Management
              <Badge variant="outline" className="ml-2">#{selectedWorkflow?.id.slice(-6)}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            {/* Left Section: Raw Text */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Original Messy Input (Read-Only)
              </Label>
              <div className="h-[400px] p-4 rounded-lg bg-muted/30 border border-white/5 font-serif text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap select-all">
                {selectedWorkflow?.raw_input_text}
              </div>
            </div>

            {/* Right Section: Editable Inputs */}
            <div className="space-y-6">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                AI Extracted Payload (Editable)
              </Label>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input 
                    id="clientName" 
                    value={editPayload.clientName}
                    onChange={(e) => setEditPayload({...editPayload, clientName: e.target.value})}
                    placeholder="Enter client name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectScope">Project Scope</Label>
                  <Textarea 
                    id="projectScope" 
                    value={editPayload.projectScope}
                    onChange={(e) => setEditPayload({...editPayload, projectScope: e.target.value})}
                    placeholder="Briefly describe the scope..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input 
                      id="estimatedHours" 
                      value={editPayload.estimatedHours}
                      onChange={(e) => setEditPayload({...editPayload, estimatedHours: e.target.value})}
                      placeholder="e.g. 40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proposedBudget">Proposed Budget</Label>
                    <Input 
                      id="proposedBudget" 
                      value={editPayload.proposedBudget}
                      onChange={(e) => setEditPayload({...editPayload, proposedBudget: e.target.value})}
                      placeholder="e.g. $5,000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={handleReject} 
              disabled={isProcessing}
              className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject Workflow
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Approve & Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
