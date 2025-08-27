'use client';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { FolderKanban, Home as HomeIcon, Users, Database, PlusCircle, Settings, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function MainNav() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex flex-col items-center gap-2 p-4">
          <Image src="/DIS_logo.png" alt="Logo" width={220} height={200} />
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold">Project Viewer</h2>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/'}>
              <Link href="/"><HomeIcon />Dashboard</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/data')}>
                <Link href="/data"><Database />Data Management</Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/people-analytics')}>
                <Link href="/people-analytics"><Users />People Analytics</Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/project-report')}>
              <Link href="/project-report"><ClipboardList />Project Report</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/add-project')}>
              <Link href="/add-project"><PlusCircle />Add Project</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
              <Link href="/settings"><Settings />Settings</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
