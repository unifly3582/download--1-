'use client';

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
import { DollarSign, Users, ShoppingCart, Package } from 'lucide-react';
import { salesData, topProductsData } from '@/lib/data';

const kpiData = [
  { title: 'Total Revenue', value: '$45,231.89', icon: DollarSign, change: '+20.1% from last month' },
  { title: 'New Customers', value: '+2,350', icon: Users, change: '+180.1% from last month' },
  { title: 'Sales', value: '+12,234', icon: ShoppingCart, change: '+19% from last month' },
  { title: 'Products in Stock', value: '573', icon: Package, change: '+201 since last hour' },
];

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

export default function DashboardPage() {
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
    </div>
  );
}
