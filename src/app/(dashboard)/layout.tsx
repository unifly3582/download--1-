import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <Nav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
