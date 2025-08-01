import { useQuery } from "@tanstack/react-query";
import { Plus, TrendingUp, ShoppingCart, AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/ui/stats-card";
import UPIQRModal from "@/components/ui/upi-qr-modal";
import { useState } from "react";
import { Link } from "wouter";

interface DashboardStats {
  todaySales: number;
  ordersCount: number;
  lowStockCount: number;
  upiCollection: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  upiApp?: string;
  totalAmount: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  nameHindi?: string;
  stock: string;
  minStock: string;
  unit: string;
}

export default function Dashboard() {
  const [showUPIModal, setShowUPIModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "partial":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodDisplay = (method?: string, app?: string) => {
    if (method === "upi" && app) {
      return `UPI - ${app.charAt(0).toUpperCase() + app.slice(1)}`;
    }
    if (method) {
      return method.charAt(0).toUpperCase() + method.slice(1);
    }
    return "Cash";
  };

  if (statsLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface p-4 rounded-lg shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Quick Stats Dashboard */}
      <section className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Today's Sales"
            value={formatCurrency(stats?.todaySales || 0)}
            icon={<TrendingUp className="h-6 w-6 text-green-600" />}
            data-testid="stats-todays-sales"
          />
          <StatsCard
            title="Orders"
            value={stats?.ordersCount?.toString() || "0"}
            icon={<ShoppingCart className="h-6 w-6 text-orange-600" />}
            data-testid="stats-orders-count"
          />
          <StatsCard
            title="Low Stock"
            value={stats?.lowStockCount?.toString() || "0"}
            icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
            valueClassName="text-red-600"
            data-testid="stats-low-stock"
          />
          <StatsCard
            title="UPI Collection"
            value={formatCurrency(stats?.upiCollection || 0)}
            icon={<CreditCard className="h-6 w-6 text-blue-600" />}
            data-testid="stats-upi-collection"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 pb-4">
        <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/new-sale">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white p-4 h-auto rounded-lg shadow-sm flex flex-col items-center space-y-2"
              data-testid="button-new-sale"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm font-medium">New Sale</span>
            </Button>
          </Link>
          <Link href="/inventory">
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white p-4 h-auto rounded-lg shadow-sm flex flex-col items-center space-y-2"
              data-testid="button-add-inventory"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add Stock</span>
            </Button>
          </Link>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto rounded-lg shadow-sm flex flex-col items-center space-y-2"
            onClick={() => setShowUPIModal(true)}
            data-testid="button-generate-qr"
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-sm font-medium">UPI QR</span>
          </Button>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Recent Orders</h2>
          <Link href="/orders">
            <Button variant="ghost" className="text-blue-600 text-sm font-medium p-0" data-testid="link-view-all-orders">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-2">
          {ordersLoading ? (
            [...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1 w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded mb-1 w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : recentOrders?.length ? (
            recentOrders.slice(0, 3).map((order) => (
              <Card key={order.id} className="shadow-sm border border-gray-100" data-testid={`card-order-${order.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium" data-testid={`text-order-number-${order.id}`}>
                          #{order.orderNumber}
                        </span>
                        <Badge 
                          className={getPaymentStatusColor(order.paymentStatus)}
                          data-testid={`badge-payment-status-${order.id}`}
                        >
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mt-1" data-testid={`text-order-customer-${order.id}`}>
                        {order.customerId ? `Customer ID: ${order.customerId}` : "Walk-in Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium" data-testid={`text-order-amount-${order.id}`}>
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-gray-600 text-xs" data-testid={`text-payment-method-${order.id}`}>
                        {getPaymentMethodDisplay(order.paymentMethod, order.upiApp)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4 text-center text-gray-500">
                No recent orders found
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Low Stock Alerts */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium flex items-center">
            <AlertTriangle className="text-red-600 mr-2 h-5 w-5" />
            Low Stock Alerts
          </h2>
          <Link href="/inventory">
            <Button variant="ghost" className="text-blue-600 text-sm font-medium p-0" data-testid="link-manage-inventory">
              Manage
            </Button>
          </Link>
        </div>
        <div className="space-y-2">
          {lowStockLoading ? (
            [...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse border-l-4 border-l-red-500">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded mb-1 w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded mb-1 w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : lowStockProducts?.length ? (
            lowStockProducts.slice(0, 3).map((product) => (
              <Card key={product.id} className="shadow-sm border border-gray-100 border-l-4 border-l-red-500" data-testid={`card-low-stock-${product.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </p>
                      {product.nameHindi && (
                        <p className="text-gray-600 text-sm font-devanagari" data-testid={`text-product-name-hindi-${product.id}`}>
                          {product.nameHindi}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-red-600 font-medium" data-testid={`text-current-stock-${product.id}`}>
                        {product.stock} {product.unit} left
                      </p>
                      <p className="text-gray-600 text-xs" data-testid={`text-min-stock-${product.id}`}>
                        Min: {product.minStock} {product.unit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-3 text-center text-gray-500">
                No low stock items
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <UPIQRModal open={showUPIModal} onOpenChange={setShowUPIModal} />
    </div>
  );
}
