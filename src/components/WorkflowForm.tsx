import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateWorkflowContent } from '@/lib/ai-client';
import { createWorkflow } from '@/lib/api';

export function WorkflowForm({ onWorkflowCreated }: { onWorkflowCreated: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (triggerSource: 'email' | 'webhook') => {
    if (!prompt.trim()) {
      toast.error('Please describe what you want to generate');
      return;
    }

    setLoading(true);
    const startTime = new Date().toISOString();
    
    try {
      // Step 1: Create initial workflow record
      const workflow = await createWorkflow({
        trigger_source: triggerSource,
        raw_input_text: prompt,
        status: 'pending_extraction',
        agent_logs: {
          steps: [
            { action: 'received', timestamp: startTime, source: triggerSource }
          ]
        }
      });

      if (!workflow) throw new Error('Failed to create workflow record');

      // Step 2: Call AI agent to extract structured data
      const docType = triggerSource === 'email' ? 'invoice' : 'quotation';
      const result = await generateWorkflowContent(prompt, docType);

      // Step 3: Update with extracted payload
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('workflows')
        .update({
          extracted_payload: result,
          status: 'completed',
          agent_logs: {
            steps: [
              { action: 'received', timestamp: startTime, source: triggerSource },
              { action: 'extraction_started', timestamp: new Date().toISOString(), model: 'qwen-plus' },
              { action: 'extraction_completed', timestamp: new Date().toISOString(), fields_extracted: Object.keys(result).length },
            ]
          }
        })
        .eq('id', workflow.id);

      if (error) throw error;

      toast.success(`Agent successfully processed ${docType} workflow`);
      setPrompt('');
      onWorkflowCreated();
    } catch (error) {
      console.error(error);
      toast.error('Agent failed to process request. Ensure DASHSCOPE_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-inner">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Autopilot Agent</CardTitle>
            <CardDescription>Enterprise automation at your command</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="e.g., Generate a quotation for Acme Corp for 5 cloud servers at $500 each..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px] bg-background/50 border-primary/10 focus-visible:ring-primary transition-all"
        />
        <div className="flex gap-3">
          <Button 
            onClick={() => handleGenerate('email')} 
            disabled={loading}
            className="flex-1 shadow-lg shadow-primary/10 active:scale-95 transition-transform"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            📧 Email → Invoice
          </Button>
          <Button 
            onClick={() => handleGenerate('webhook')} 
            disabled={loading}
            variant="secondary"
            className="flex-1 active:scale-95 transition-transform"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            🔗 Webhook → Quote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
