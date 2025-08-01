import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Receipt, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  upiApp?: string;
  totalAmount: string;
  paidAmount: string;
  discountAmount: string;
  gstAmount: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
}

interface OrderWithItems {
  order: Order;
  items: Array<{
    id: string;
    productId: string;
    quantity: string;
    unitPrice: string;
    totalPrice: string;
    gstRate: string;
    product: {
      name: string;
      nameHindi?: string;
      unit: string;
    };
  }>;
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: orderDetails, isLoading: orderDetailsLoading } = useQuery<OrderWithItems>({
    queryKey: ["/api/orders", selectedOrder],
    enabled: !!selectedOrder,
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  }) || [];

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-gray-600">Track and manage your orders</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-orders"
          />
        </div>

        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="flex-1" data-testid="select-payment-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {ordersLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1 w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded mb-1 w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <Card key={order.id} className="shadow-sm border border-gray-100" data-testid={`card-order-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium" data-testid={`text-order-number-${order.id}`}>
                        #{order.orderNumber}
                      </span>
                      <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                        {order.status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)} data-testid={`badge-payment-status-${order.id}`}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm" data-testid={`text-customer-${order.id}`}>
                      {order.customerId ? `Customer ID: ${order.customerId}` : "Walk-in Customer"}
                    </p>
                    <p className="text-gray-500 text-xs" data-testid={`text-order-date-${order.id}`}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg" data-testid={`text-order-total-${order.id}`}>
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-gray-600 text-xs mb-2" data-testid={`text-payment-method-${order.id}`}>
                      {getPaymentMethodDisplay(order.paymentMethod, order.upiApp)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order.id)}
                      data-testid={`button-view-order-${order.id}`}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Orders will appear here once customers start making purchases"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {orderDetailsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : orderDetails ? (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="border-b pb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-lg">#{orderDetails.order.orderNumber}</span>
                  <Badge className={getStatusColor(orderDetails.order.status)}>
                    {orderDetails.order.status}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-1">
                  {formatDate(orderDetails.order.createdAt)}
                </p>
                <p className="text-gray-600 text-sm">
                  {orderDetails.order.customerId 
                    ? `Customer ID: ${orderDetails.order.customerId}` 
                    : "Walk-in Customer"}
                </p>
                {orderDetails.order.deliveryAddress && (
                  <p className="text-gray-600 text-sm mt-2">
                    <strong>Delivery:</strong> {orderDetails.order.deliveryAddress}
                  </p>
                )}
                {orderDetails.order.notes && (
                  <p className="text-gray-600 text-sm mt-2">
                    <strong>Notes:</strong> {orderDetails.order.notes}
                  </p>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-2">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        {item.product.nameHindi && (
                          <p className="text-gray-600 text-xs font-devanagari">
                            {item.product.nameHindi}
                          </p>
                        )}
                        <p className="text-gray-600 text-xs">
                          {item.quantity} {item.product.unit} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium text-sm">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency((parseFloat(orderDetails.order.totalAmount) - parseFloat(orderDetails.order.gstAmount || "0")).toString())}</span>
                  </div>
                  {parseFloat(orderDetails.order.gstAmount || "0") > 0 && (
                    <div className="flex justify-between">
                      <span>GST:</span>
                      <span>{formatCurrency(orderDetails.order.gstAmount || "0")}</span>
                    </div>
                  )}
                  {parseFloat(orderDetails.order.discountAmount || "0") > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(orderDetails.order.discountAmount || "0")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-base border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(orderDetails.order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="text-green-600">{formatCurrency(orderDetails.order.paidAmount)}</span>
                  </div>
                  {parseFloat(orderDetails.order.paidAmount) < parseFloat(orderDetails.order.totalAmount) && (
                    <div className="flex justify-between text-red-600">
                      <span>Pending:</span>
                      <span>{formatCurrency((parseFloat(orderDetails.order.totalAmount) - parseFloat(orderDetails.order.paidAmount)).toString())}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Method:</span>
                    <span className="text-sm font-medium">
                      {getPaymentMethodDisplay(orderDetails.order.paymentMethod, orderDetails.order.upiApp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm">Payment Status:</span>
                    <Badge className={getPaymentStatusColor(orderDetails.order.paymentStatus)}>
                      {orderDetails.order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">Order details not found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
