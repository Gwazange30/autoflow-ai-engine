import { LayoutDashboard, FileText, ClipboardList, Settings, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'quotations', label: 'Quotations', icon: ClipboardList },
  { id: 'approvals', label: 'Approvals', icon: ChevronRight },
  { id: 'workflows', label: 'Workflow Logs', icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-64 h-screen bg-card border-r flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <img src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/46af5f45-77d4-4c32-b63f-8041aaa31fbb/autoflow-agent-logo-ffdacb77-1782511231211.webp" alt="Logo" className="w-6 h-6 object-contain" />
        </div>
        <h1 className="font-bold text-xl tracking-tight">AutoFlow</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            {activeTab === item.id && <ChevronRight className="ml-auto w-4 h-4" />}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
