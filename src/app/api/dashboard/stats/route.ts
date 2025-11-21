import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const ordersRef = db.collection('orders');
    const customersRef = db.collection('customers');
    const productsRef = db.collection('products');

    const [
      currentMonthOrders,
      lastMonthOrders,
      currentMonthCustomers,
      lastMonthCustomers,
      allProducts
    ] = await Promise.all([
      ordersRef.where('createdAt', '>=', currentMonthStart.toISOString()).get(),
      ordersRef.where('createdAt', '>=', lastMonthStart.toISOString()).where('createdAt', '<=', lastMonthEnd.toISOString()).get(),
      customersRef.where('createdAt', '>=', currentMonthStart.toISOString()).get(),
      customersRef.where('createdAt', '>=', lastMonthStart.toISOString()).where('createdAt', '<=', lastMonthEnd.toISOString()).get(),
      productsRef.get()
    ]);

    const currentRevenue = currentMonthOrders.docs.reduce((sum: number, doc: any) => {
      const order = doc.data();
      return sum + (order.paymentInfo?.status === 'Completed' ? (order.totalPrice || 0) : 0);
    }, 0);

    const lastRevenue = lastMonthOrders.docs.reduce((sum: number, doc: any) => {
      const order = doc.data();
      return sum + (order.paymentInfo?.status === 'Completed' ? (order.totalPrice || 0) : 0);
    }, 0);

    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const customersChange = lastMonthCustomers.size > 0 ? ((currentMonthCustomers.size - lastMonthCustomers.size) / lastMonthCustomers.size) * 100 : 0;
    const ordersChange = lastMonthOrders.size > 0 ? ((currentMonthOrders.size - lastMonthOrders.size) / lastMonthOrders.size) * 100 : 0;

    let totalStock = 0;
    allProducts.docs.forEach((doc: any) => {
      const product = doc.data();
      if (product.variations && Array.isArray(product.variations)) {
        product.variations.forEach((variation: any) => {
          totalStock += variation.stock || 0;
        });
      }
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentOrders = await ordersRef.where('createdAt', '>=', sixMonthsAgo.toISOString()).get();

    const monthlySales: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${monthNames[date.getMonth()]}`;
      monthlySales[monthKey] = 0;
    }

    recentOrders.docs.forEach((doc: any) => {
      const order = doc.data();
      if (order.paymentInfo?.status === 'Completed' && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const monthKey = monthNames[orderDate.getMonth()];
        if (monthlySales.hasOwnProperty(monthKey)) {
          monthlySales[monthKey] += order.totalPrice || 0;
        }
      }
    });

    const salesData = Object.entries(monthlySales).map(([month, sales]) => ({
      month,
      sales: Math.round(sales)
    }));

    const productSales: { [key: string]: number } = {};
    recentOrders.docs.forEach((doc: any) => {
      const order = doc.data();
      if (order.paymentInfo?.status === 'Completed' && order.items) {
        order.items.forEach((item: any) => {
          const productName = item.productName || 'Unknown';
          productSales[productName] = (productSales[productName] || 0) + (item.quantity || 0);
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      kpi: {
        totalRevenue: Math.round(currentRevenue),
        revenueChange: Math.round(revenueChange * 10) / 10,
        newCustomers: currentMonthCustomers.size,
        customersChange: Math.round(customersChange * 10) / 10,
        totalOrders: currentMonthOrders.size,
        ordersChange: Math.round(ordersChange * 10) / 10,
        productsInStock: totalStock,
        stockChange: 0
      },
      salesData,
      topProducts
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
