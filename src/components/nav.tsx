'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Settings,
  CreditCard,
  Truck,
  Ticket,
  BarChart3,
  Box,
} from 'lucide-react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/coupons', icon: Ticket, label: 'Coupons' },
  { href: '/tracking', icon: Truck, label: 'Tracking' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/combinations', icon: Box, label: 'Combinations' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/settings/checkout', icon: CreditCard, label: 'Checkout Settings' },
  { href: '/settings/delhivery', icon: Truck, label: 'Delhivery Settings' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-2">
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                size="sm"
                className="px-2 py-1.5 text-xs"
              >
                <Link href={item.href}>
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
