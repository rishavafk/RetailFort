import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Package, AlertTriangle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  nameHindi?: string;
  categoryId?: string;
  price: string;
  stock: string;
  unit: string;
  minStock: string;
  barcode?: string;
  isPackaged: boolean;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  nameHindi?: string;
}

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  nameHindi: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  stock: z.string().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  minStock: z.string().min(0, "Min stock cannot be negative"),
  barcode: z.string().optional(),
  isPackaged: z.boolean().default(true),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowAddProduct(false);
      toast({ title: "Product created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const response = await apiRequest("PUT", `/api/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setEditingProduct(null);
      toast({ title: "Product updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await apiRequest("PUT", `/api/products/${id}/stock`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Stock updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update stock", variant: "destructive" });
    },
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      nameHindi: "",
      price: "",
      stock: "0",
      unit: "pcs",
      minStock: "10",
      isPackaged: true,
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.nameHindi?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const lowStockProducts = filteredProducts.filter(product =>
    parseFloat(product.stock) <= parseFloat(product.minStock)
  );

  const isLowStock = (product: Product) =>
    parseFloat(product.stock) <= parseFloat(product.minStock);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      nameHindi: product.nameHindi || "",
      categoryId: product.categoryId || "",
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      minStock: product.minStock,
      barcode: product.barcode || "",
      isPackaged: product.isPackaged,
      description: product.description || "",
    });
  };

  const handleQuickStockUpdate = (productId: string, change: number) => {
    updateStockMutation.mutate({ id: productId, quantity: change });
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-gray-600">Manage your products and stock</p>
        </div>
        <Dialog open={showAddProduct || !!editingProduct} onOpenChange={(open) => {
          if (!open) {
            setShowAddProduct(false);
            setEditingProduct(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddProduct(true)} data-testid="button-add-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name (English)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-product-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nameHindi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name (Hindi)</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-devanagari" data-testid="input-product-name-hindi" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                              {category.nameHindi && ` (${category.nameHindi})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-unit">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pcs">Pieces</SelectItem>
                            <SelectItem value="kg">Kilogram</SelectItem>
                            <SelectItem value="g">Gram</SelectItem>
                            <SelectItem value="L">Liter</SelectItem>
                            <SelectItem value="ml">Milliliter</SelectItem>
                            <SelectItem value="dozen">Dozen</SelectItem>
                            <SelectItem value="box">Box</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" {...field} data-testid="input-stock" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock Alert</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" {...field} data-testid="input-min-stock" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-barcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPackaged"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Packaged Item</FormLabel>
                        <div className="text-sm text-gray-600">
                          Turn off for loose/generic items
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-packaged" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1" disabled={createProductMutation.isPending || updateProductMutation.isPending} data-testid="button-save-product">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                    form.reset();
                  }} data-testid="button-cancel">
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
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

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {lowStockProducts.length} items running low on stock
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Products List */}
      <div className="space-y-3">
        {productsLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1 w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded mb-1 w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Card key={product.id} className={`${isLowStock(product) ? 'border-red-200' : ''}`} data-testid={`card-product-${product.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
                      {!product.isPackaged && (
                        <Badge variant="outline" className="text-xs">Loose</Badge>
                      )}
                      {isLowStock(product) && (
                        <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                      )}
                    </div>
                    {product.nameHindi && (
                      <p className="text-gray-600 text-sm font-devanagari mb-1" data-testid={`text-product-name-hindi-${product.id}`}>
                        {product.nameHindi}
                      </p>
                    )}
                    <p className="text-green-600 font-medium text-sm" data-testid={`text-product-price-${product.id}`}>
                      {formatCurrency(product.price)} per {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => handleQuickStockUpdate(product.id, -1)}
                        disabled={updateStockMutation.isPending}
                        data-testid={`button-decrease-stock-${product.id}`}
                      >
                        -
                      </Button>
                      <span className={`font-medium px-2 ${isLowStock(product) ? 'text-red-600' : ''}`} data-testid={`text-current-stock-${product.id}`}>
                        {product.stock} {product.unit}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => handleQuickStockUpdate(product.id, 1)}
                        disabled={updateStockMutation.isPending}
                        data-testid={`button-increase-stock-${product.id}`}
                      >
                        +
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-500 text-xs" data-testid={`text-min-stock-${product.id}`}>
                        Min: {product.minStock}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEditProduct(product)}
                        data-testid={`button-edit-product-${product.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Start by adding your first product"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddProduct(true)} data-testid="button-add-first-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
