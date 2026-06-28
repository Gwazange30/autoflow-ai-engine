import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { WorkflowList } from './components/WorkflowList';
import { WorkflowForm } from './components/WorkflowForm';
import { PendingApprovals } from './components/PendingApprovals';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { FileText, ClipboardList, TrendingUp, Users, Zap } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { simulateWebhookRequest } from './lib/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.title = 'AutoFlow Agent';
  }, []);

  const handleWorkflowCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSimulateRequest = async () => {
    const text = "Hey Aliyu, it's Mike from Vertex Corp. We need a 4-page e-commerce template mockup built out with React and Tailwind. We have a max budget of around $3,500 and we need it done in roughly 45 billing hours. Can you send an itemized estimate?";
    
    const promise = simulateWebhookRequest(text);
    
    toast.promise(promise, {
      loading: 'Simulating messy request...',
      success: () => {
        handleWorkflowCreated();
        setActiveTab('approvals');
        return 'Request simulated and processed by AI!';
      },
      error: (err) => `Failed to process request: ${err.message}`,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Revenue" value="$45,231.89" icon={TrendingUp} trend="+20.1%" />
              <StatCard title="Active Invoices" value="12" icon={FileText} trend="+3 from last month" />
              <StatCard title="Pending Quotes" value="24" icon={ClipboardList} trend="-4% from last month" />
              <StatCard title="New Clients" value="573" icon={Users} trend="+201 since last week" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <WorkflowList refreshKey={refreshKey} />
              </div>
              <div>
                <WorkflowForm onWorkflowCreated={handleWorkflowCreated} />
              </div>
            </div>
          </div>
        );
      case 'invoices':
      case 'quotations':
      case 'workflows':
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <WorkflowList refreshKey={refreshKey} />
          </div>
        );
      case 'approvals':
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <PendingApprovals refreshKey={refreshKey} />
          </div>
        );
      default:
        return <div>Section coming soon...</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-8 overflow-y-auto bg-[url('https://storage.googleapis.com/dala-prod-public-storage/generated-images/46af5f45-77d4-4c32-b63f-8041aaa31fbb/dashboard-background-c9ee1952-1782511233090.webp')] bg-fixed bg-cover bg-no-repeat bg-center">
          <div className="max-w-7xl mx-auto space-y-6 bg-background/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h2>
                <p className="text-muted-foreground">Manage your enterprise automation pipeline and agents.</p>
              </div>
              
              {activeTab === 'dashboard' && (
                <Button 
                  variant="outline" 
                  onClick={handleSimulateRequest}
                  className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-all active:scale-95 shadow-sm"
                >
                  <Zap className="w-4 h-4 mr-2 text-primary fill-primary/20" />
                  Simulate Messy Incoming Request
                </Button>
              )}
            </div>
            
            {renderContent()}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend: string }) {
  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer group">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          <span className={trend.startsWith('+') ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {trend}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

export default App;
