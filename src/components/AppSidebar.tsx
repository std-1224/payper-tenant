import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText,
  LogOut,
  Shield
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Tenants", url: "/admin/tenants", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Audit", url: "/admin/audit", icon: FileText },
];

const venueMenuItems = [
  { title: "Venues", url: "/admin/venues", icon: Building2 },
  { title: "Orders", url: "/admin/orders", icon: FileText },
  { title: "Stock", url: "/admin/stock", icon: LayoutDashboard },
  { title: "Recipes", url: "/admin/recipes", icon: FileText },
  { title: "Bars & QR", url: "/admin/bars", icon: LayoutDashboard },
  { title: "Venue Users", url: "/admin/venue-users", icon: Users },
  { title: "Staff", url: "/admin/staff", icon: Shield },
  { title: "Cashflow", url: "/admin/cashflow", icon: FileText },
  { title: "Alerts", url: "/admin/alerts", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, globalAdmin } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'support_admin': return 'Support';
      case 'sales_admin': return 'Sales';
      case 'read_only': return 'Read Only';
      default: return role;
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">Payper Admin</span>
              </div>
            )}
            {collapsed && (
              <Shield className="h-5 w-5 text-primary mx-auto" />
            )}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url} 
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4">
            {!collapsed && "Venue Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {venueMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url} 
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-4 py-3 space-y-3">
              {!collapsed && globalAdmin && (
                <div>
                  <p className="text-xs font-medium text-sidebar-foreground">Role</p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleLabel(globalAdmin.role)}
                  </p>
                </div>
              )}
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent transition-colors"
                title={collapsed ? "Sign Out" : undefined}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
