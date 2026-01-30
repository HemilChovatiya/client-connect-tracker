import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Shield,
  Settings,
  LogOut,
  MapPin,
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', url: '/superadmin', icon: LayoutDashboard },
  { title: 'Customers', url: '/superadmin/customers', icon: Building2 },
  { title: 'Financial Years', url: '/superadmin/financial-years', icon: Calendar },
  { title: 'Modules', url: '/superadmin/modules', icon: Settings },
  { title: 'Permissions', url: '/superadmin/permissions', icon: Shield },
  { title: 'Users', url: '/superadmin/users', icon: Users },
];

export const SuperadminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {!collapsed && <span>Collection Tracker</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === '/superadmin'}
                      className="flex items-center gap-2"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2 border-t">
          {!collapsed && (
            <p className="text-xs text-muted-foreground mb-2 truncate px-2">
              {user?.email}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && 'Sign Out'}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
