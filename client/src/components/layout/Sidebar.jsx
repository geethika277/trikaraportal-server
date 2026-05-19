import { NavLink } from 'react-router-dom';
import {
  Dashboard as LayoutDashboard, Group, TrackChanges, Business, HowToReg as UserCheck, TrendingUp,
  ViewKanban, CheckBox, InsertDriveFile, Settings, DeviceHub, Notifications,
  BarChart as BarChart3, Work as Briefcase
} from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['superadmin', 'project_manager', 'developer', 'tester', 'bde', 'accounting'] },
    ],
  },
  {
    label: 'Sales & Marketing',
    roles: ['superadmin', 'bde', 'project_manager'],
    items: [
      { to: '/leads', icon: TrackChanges, label: 'Leads', roles: ['superadmin', 'bde', 'project_manager'] },
      { to: '/accounts', icon: Business, label: 'Accounts', roles: ['superadmin', 'bde', 'project_manager', 'accounting'] },
      { to: '/contacts', icon: UserCheck, label: 'Contacts', roles: ['superadmin', 'bde', 'project_manager'] },
      { to: '/opportunities', icon: TrendingUp, label: 'Opportunities', roles: ['superadmin', 'bde', 'project_manager'] },
      { to: '/sales-funnel', icon: BarChart3, label: 'Sales Funnel', roles: ['superadmin', 'bde', 'project_manager'] },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { to: '/projects', icon: ViewKanban, label: 'Projects', roles: ['superadmin', 'project_manager', 'developer', 'tester', 'accounting', 'bde'] },
      { to: '/tasks', icon: CheckBox, label: 'My Tasks', roles: ['superadmin', 'project_manager', 'developer', 'tester', 'bde', 'accounting'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/invoices', icon: InsertDriveFile, label: 'Invoices', roles: ['superadmin', 'accounting', 'project_manager'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/users', icon: Group, label: 'Team', roles: ['superadmin', 'project_manager'] },
      { to: '/settings', icon: Settings, label: 'Settings', roles: ['superadmin'] },
    ],
  },
];

export function Sidebar({ collapsed }) {
  const user = useAuthStore(s => s.user);
  const role = user?.role;

  return (
    <aside className={cn(
      'flex flex-col h-full bg-gray-900 text-gray-100 transition-all duration-200',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-700', collapsed && 'justify-center px-0')}>
        <div className="flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="Trikara" className="h-8 object-contain" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 space-y-6">
        {navGroups.map(group => {
          const visibleItems = group.items.filter(item => item.roles.includes(role));
          if (!visibleItems.length) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-none',
                        isActive ? 'bg-primary/20 text-primary border-r-2 border-primary' : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                        collapsed && 'justify-center px-0'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className={cn('p-4 border-t border-gray-700', collapsed && 'flex justify-center')}>
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
