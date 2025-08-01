import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/ui/stats-card";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  paymentMethod: string;
  upiApp?: string;
  description?: string;
  createdAt: string;
}

export default function Reports() {
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState("today");

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(num);
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

  // Calculate stats from transactions
  const todayTransactions = transactions?.filter(transaction => {
    const today = new Date();
    const transactionDate = new Date(transaction.createdAt);
    return transactionDate.toDateString() === today.toDateString();
  }) || [];

  const todaySales = todayTransactions
    .filter(t => t.type === "sale")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const todayUPI = todayTransactions
    .filter(t => t.type === "sale" && t.paymentMethod === "upi")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const todayCash = todayTransactions
    .filter(t => t.type === "sale" && t.paymentMethod === "cash")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const todayTransactionCount = todayTransactions.filter(t => t.type === "sale").length;

  // Group transactions by payment method
  const paymentMethodBreakdown = todayTransactions
    .filter(t => t.type === "sale")
    .reduce((acc, transaction) => {
      const method = transaction.paymentMethod === "upi" && transaction.upiApp 
        ? `UPI - ${transaction.upiApp}` 
        : transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1);
      
      acc[method] = (acc[method] || 0) + parseFloat(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-600">Business analytics and insights</p>
        </div>
        <Button variant="outline" size="sm" data-testid="button-export-report">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger data-testid="select-report-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily Report</SelectItem>
            <SelectItem value="weekly">Weekly Report</SelectItem>
            <SelectItem value="monthly">Monthly Report</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger data-testid="select-date-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 Days</SelectItem>
            <SelectItem value="last30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <section>
        <h2 className="text-lg font-medium mb-3">Today's Performance</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Total Sales"
            value={formatCurrency(todaySales)}
            icon={<TrendingUp className="h-6 w-6 text-green-600" />}
            data-testid="stats-total-sales"
          />
          <StatsCard
            title="Transactions"
            value={todayTransactionCount.toString()}
            icon={<Calendar className="h-6 w-6 text-blue-600" />}
            data-testid="stats-transaction-count"
          />
          <StatsCard
            title="UPI Collection"
            value={formatCurrency(todayUPI)}
            icon={<div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>}
            data-testid="stats-upi-collection"
          />
          <StatsCard
            title="Cash Collection"
            value={formatCurrency(todayCash)}
            icon={<div className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>}
            data-testid="stats-cash-collection"
          />
        </div>
      </section>

      {/* Payment Method Breakdown */}
      <section>
        <h2 className="text-lg font-medium mb-3">Payment Method Breakdown</h2>
        <Card>
          <CardContent className="p-4">
            {Object.keys(paymentMethodBreakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(paymentMethodBreakdown).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between" data-testid={`payment-method-${method.toLowerCase().replace(/\s+/g, '-')}`}>
                    <span className="font-medium">{method}</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(amount)}</div>
                      <div className="text-xs text-gray-600">
                        {((amount / todaySales) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-600">
                No transactions found for today
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent Transactions */}
      <section>
        <h2 className="text-lg font-medium mb-3">Recent Transactions</h2>
        <div className="space-y-2">
          {transactionsLoading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-1 w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded mb-1 w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : transactions && transactions.length > 0 ? (
            transactions.slice(0, 10).map((transaction) => (
              <Card key={transaction.id} className="shadow-sm border border-gray-100" data-testid={`transaction-${transaction.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${transaction.type === "sale" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === "sale" ? "Sale" : transaction.type}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {transaction.paymentMethod === "upi" && transaction.upiApp 
                            ? `UPI - ${transaction.upiApp}` 
                            : transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{transaction.description || "No description"}</p>
                      <p className="text-gray-500 text-xs">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === "sale" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "sale" ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-gray-600">No transactions found</div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button variant="outline" className="w-full justify-start" data-testid="button-export-pdf">
            <Download className="h-4 w-4 mr-2" />
            Export to PDF
          </Button>
          <Button variant="outline" className="w-full justify-start" data-testid="button-export-gst">
            <Download className="h-4 w-4 mr-2" />
            GST Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
