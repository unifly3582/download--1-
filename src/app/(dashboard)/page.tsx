'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  PieLabelRenderProps,
} from 'recharts';
import { DollarSign, Users, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { salesData, topProductsData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authenticatedFetch } from '@/lib/api/utils';
import Link from 'next/link';
import type { Issue } from '@/types/issue';

const kpiData = [
  { title: 'Total Revenue', value: '$45,231.89', icon: DollarSign, change: '+20.1% from last month' },
  { title: 'New Customers', value: '+2,350', icon: Users, change: '+180.1% from last month' },
  { title: 'Sales', value: '+12,234', icon: ShoppingCart, change: '+19% from last month' },
  { title: 'Products in Stock', value: '573', icon: Package, change: '+201 since last hour' },
];

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

export default function DashboardPage() {
  const [openIssues, setOpenIssues] = useState<Issue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);

  useEffect(() => {
    loadOpenIssues();
  }, []);

  const loadOpenIssues = async () => {
    try {
      const data = await authenticatedFetch('/api/issues?status=open');
      setOpenIssues(data.data?.slice(0, 5) || []); // Show top 5
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[priority as keyof typeof colors];
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 bg-card">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Monthly sales performance.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{ fill: 'hsla(var(--card))' }} contentStyle={{ backgroundColor: 'hsla(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3 bg-card">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Your best performers this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                 <Tooltip cursor={{ fill: 'hsla(var(--card))' }} contentStyle={{ backgroundColor: 'hsla(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Pie
                  data={topProductsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={(props: PieLabelRenderProps) => `${props.name} ${( (props.percent as number) * 100).toFixed(0)}%`}
                >
                  {topProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Open Issues Widget */}
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Open Issues
            </CardTitle>
            <CardDescription>Active shipment problems requiring attention</CardDescription>
          </div>
          <Link href="/issues">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoadingIssues ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Loading issues...
            </div>
          ) : openIssues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No open issues</p>
              <p className="text-xs">All shipments are running smoothly!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openIssues.map((issue) => (
                <Link key={issue.issueId} href="/issues">
                  <div className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{issue.issueId}</span>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(issue.priority)}`}>
                            {issue.priority.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Order: {issue.orderId}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-1">{issue.issueDescription}</p>
                        <div className="text-xs text-muted-foreground">
                          {getTimeAgo(issue.createdAt)}
                          {issue.assignedTo && ` • Assigned to ${issue.assignedTo}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {openIssues.length >= 5 && (
                <div className="text-center pt-2">
                  <Link href="/issues">
                    <Button variant="link" size="sm">
                      View all open issues →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
