import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, Search, ShoppingCart, User, CreditCard, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import UPIQRModal from "@/components/ui/upi-qr-modal";

interface Product {
  id: string;
  name: string;
  nameHindi?: string;
  price: string;
  stock: string;
  unit: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  landmark?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  landmark: z.string().optional(),
});

const orderFormSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  upiApp: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryLandmark: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;
type OrderFormData = z.infer<typeof orderFormSchema>;

export default function NewSale() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomer(newCustomer);
      setShowCustomerForm(false);
      customerForm.reset();
      toast({ title: "Customer added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add customer", variant: "destructive" });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { order: any; items: any[] }) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setCurrentOrderId(order.id);
      
      if (orderForm.getValues("paymentMethod") === "upi") {
        setShowUPIModal(true);
      } else {
        toast({ title: "Order created successfully" });
        setLocation("/orders");
      }
    },
    onError: () => {
      toast({ title: "Failed to create order", variant: "destructive" });
    },
  });

  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      landmark: "",
    },
  });

  const orderForm = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      paymentMethod: "cash",
    },
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.nameHindi?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    const price = parseFloat(product.price);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > parseFloat(product.stock)) {
        toast({ title: "Insufficient stock", variant: "destructive" });
        return;
      }
      
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * price }
          : item
      ));
    } else {
      if (parseFloat(product.stock) < 1) {
        toast({ title: "Product out of stock", variant: "destructive" });
        return;
      }
      
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: price,
        totalPrice: price
      }]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
      return;
    }

    const product = products?.find(p => p.id === productId);
    if (product && quantity > parseFloat(product.stock)) {
      toast({ title: "Insufficient stock", variant: "destructive" });
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const gstAmount = cartTotal * 0.18; // 18% GST
  const finalTotal = cartTotal + gstAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-4);
    return `ORD-${year}${month}${day}-${time}`;
  };

  const onCustomerSubmit = (data: CustomerFormData) => {
    createCustomerMutation.mutate(data);
  };

  const onOrderSubmit = (data: OrderFormData) => {
    if (cart.length === 0) {
      toast({ title: "Please add items to cart", variant: "destructive" });
      return;
    }

    const orderData = {
      orderNumber: generateOrderNumber(),
      customerId: selectedCustomer?.id,
      status: "completed",
      paymentStatus: "paid",
      paymentMethod: data.paymentMethod,
      upiApp: data.upiApp,
      totalAmount: finalTotal.toString(),
      paidAmount: finalTotal.toString(),
      gstAmount: gstAmount.toString(),
      deliveryAddress: data.deliveryAddress,
      deliveryLandmark: data.deliveryLandmark,
      notes: data.notes,
    };

    const orderItems = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      totalPrice: item.totalPrice.toString(),
      gstRate: "18",
    }));

    createOrderMutation.mutate({ order: orderData, items: orderItems });
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Sale</h1>
          <p className="text-gray-600">Create a new order</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          data-testid="button-back-to-dashboard"
        >
          Back
        </Button>
      </div>

      {/* Customer Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <User className="h-4 w-4 mr-2" />
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium" data-testid="text-selected-customer-name">
                  {selectedCustomer.name}
                </p>
                <p className="text-sm text-gray-600" data-testid="text-selected-customer-phone">
                  {selectedCustomer.phone}
                </p>
                {selectedCustomer.address && (
                  <p className="text-sm text-gray-600" data-testid="text-selected-customer-address">
                    {selectedCustomer.address}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
                data-testid="button-remove-customer"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Select onValueChange={(customerId) => {
                const customer = customers?.find(c => c.id === customerId);
                if (customer) setSelectedCustomer(customer);
              }}>
                <SelectTrigger data-testid="select-existing-customer">
                  <SelectValue placeholder="Select existing customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-center">
                <span className="text-sm text-gray-600">or</span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCustomerForm(true)}
                data-testid="button-add-new-customer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-products"
        />
      </div>

      {/* Products List */}
      <div className="space-y-2">
        {productsLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1 w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredProducts.slice(0, 5).map((product) => (
            <Card key={product.id} className="shadow-sm border border-gray-100" data-testid={`card-product-${product.id}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {product.stock} {product.unit}
                      </Badge>
                    </div>
                    {product.nameHindi && (
                      <p className="text-gray-600 text-sm font-devanagari" data-testid={`text-product-name-hindi-${product.id}`}>
                        {product.nameHindi}
                      </p>
                    )}
                    <p className="text-green-600 font-medium text-sm" data-testid={`text-product-price-${product.id}`}>
                      {formatCurrency(parseFloat(product.price))} per {product.unit}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToCart(product)}
                    disabled={parseFloat(product.stock) === 0}
                    data-testid={`button-add-to-cart-${product.id}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between p-2 bg-white rounded" data-testid={`cart-item-${item.product.id}`}>
                <div className="flex-1">
                  <p className="font-medium text-sm" data-testid={`text-cart-product-name-${item.product.id}`}>
                    {item.product.name}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {formatCurrency(item.unitPrice)} per {item.product.unit}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    data-testid={`button-decrease-quantity-${item.product.id}`}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium text-sm w-8 text-center" data-testid={`text-cart-quantity-${item.product.id}`}>
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    data-testid={`button-increase-quantity-${item.product.id}`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium text-sm w-16 text-right" data-testid={`text-cart-total-${item.product.id}`}>
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              </div>
            ))}

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span data-testid="text-cart-subtotal">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST (18%):</span>
                <span data-testid="text-cart-gst">{formatCurrency(gstAmount)}</span>
              </div>
              <div className="flex justify-between font-medium text-base border-t pt-2">
                <span>Total:</span>
                <span data-testid="text-cart-final-total">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout */}
      {cart.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit(onOrderSubmit)} className="space-y-4">
                <FormField
                  control={orderForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {orderForm.watch("paymentMethod") === "upi" && (
                  <FormField
                    control={orderForm.control}
                    name="upiApp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI App</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-upi-app">
                              <SelectValue placeholder="Select UPI app" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="phonepe">PhonePe</SelectItem>
                            <SelectItem value="googlepay">Google Pay</SelectItem>
                            <SelectItem value="paytm">Paytm</SelectItem>
                            <SelectItem value="bhim">BHIM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={orderForm.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="input-delivery-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={orderForm.control}
                  name="deliveryLandmark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landmark (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Near temple, bus stop, etc." data-testid="input-delivery-landmark" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={orderForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="input-order-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createOrderMutation.isPending}
                  data-testid="button-complete-sale"
                >
                  Complete Sale - {formatCurrency(finalTotal)}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Customer Form Modal */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
              <FormField
                control={customerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-new-customer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} data-testid="input-new-customer-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customerForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-new-customer-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customerForm.control}
                name="landmark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Landmark (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Near temple, bus stop, etc." data-testid="input-new-customer-landmark" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1" disabled={createCustomerMutation.isPending} data-testid="button-save-new-customer">
                  Add Customer
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCustomerForm(false)} data-testid="button-cancel-customer">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* UPI QR Modal */}
      <UPIQRModal
        open={showUPIModal}
        onOpenChange={setShowUPIModal}
        amount={finalTotal}
        orderId={currentOrderId}
        onPaymentComplete={() => {
          toast({ title: "Payment completed successfully" });
          setLocation("/orders");
        }}
      />
    </div>
  );
}
