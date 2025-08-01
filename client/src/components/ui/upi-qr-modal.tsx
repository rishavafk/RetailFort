import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QrCode, Share, Printer, X, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateUPIQRCode, formatUPIAmount } from "@/lib/upi-utils";

interface UPIQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount?: number;
  orderId?: string | null;
  onPaymentComplete?: () => void;
}

interface UPIData {
  upiUrl: string;
  qrData: string;
  shopName: string;
  shopNameHindi?: string;
  upiId: string;
  amount?: number;
  description?: string;
}

export default function UPIQRModal({ 
  open, 
  onOpenChange, 
  amount, 
  orderId,
  onPaymentComplete 
}: UPIQRModalProps) {
  const [customAmount, setCustomAmount] = useState<string>(amount?.toString() || "");
  const [description, setDescription] = useState<string>(orderId ? `Order ${orderId}` : "Payment");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: upiData, isLoading, refetch } = useQuery<UPIData>({
    queryKey: ["/api/upi/generate-qr", customAmount, description],
    enabled: open && !!customAmount,
    queryFn: async () => {
      const response = await fetch("/api/upi/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(customAmount),
          description,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate UPI QR");
      return response.json();
    },
  });

  useEffect(() => {
    if (upiData?.qrData) {
      // Generate QR code using a QR code library or service
      generateUPIQRCode(upiData.qrData).then(setQrCodeUrl);
    }
  }, [upiData]);

  const handleAmountChange = (value: string) => {
    setCustomAmount(value);
    if (value && parseFloat(value) > 0) {
      refetch();
    }
  };

  const handleShare = async () => {
    if (!upiData) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Payment to ${upiData.shopName}`,
          text: `Pay ₹${formatUPIAmount(parseFloat(customAmount))} to ${upiData.shopName}`,
          url: upiData.upiUrl,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(upiData.upiUrl);
        toast({ title: "UPI link copied to clipboard" });
      }
    } catch (error) {
      toast({ title: "Failed to share", variant: "destructive" });
    }
  };

  const handleCopyUPIId = async () => {
    if (!upiData?.upiId) return;
    
    try {
      await navigator.clipboard.writeText(upiData.upiId);
      setCopied(true);
      toast({ title: "UPI ID copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Failed to copy UPI ID", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    if (!qrCodeUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>UPI QR Code - ${upiData?.shopName}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .qr-container { 
                border: 2px solid #000; 
                display: inline-block; 
                padding: 20px; 
                margin: 20px 0; 
              }
              .shop-name { 
                font-size: 24px; 
                font-weight: bold; 
                margin: 10px 0; 
              }
              .shop-name-hindi { 
                font-size: 18px; 
                margin: 5px 0; 
              }
              .upi-id { 
                font-size: 16px; 
                margin: 10px 0; 
              }
              .amount { 
                font-size: 20px; 
                color: #0066cc; 
                font-weight: bold; 
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${qrCodeUrl}" alt="UPI QR Code" style="width: 200px; height: 200px;" />
              <div class="shop-name">${upiData?.shopName}</div>
              ${upiData?.shopNameHindi ? `<div class="shop-name-hindi">${upiData.shopNameHindi}</div>` : ''}
              <div class="upi-id">${upiData?.upiId}</div>
              ${customAmount ? `<div class="amount">₹${formatUPIAmount(parseFloat(customAmount))}</div>` : ''}
              <div style="margin-top: 10px; font-size: 14px;">Scan to pay with any UPI app</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePaymentComplete = () => {
    toast({ title: "Payment completed successfully!" });
    onPaymentComplete?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="upi-qr-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              UPI QR Code
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={customAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount"
              data-testid="input-upi-amount"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Payment description"
              data-testid="input-upi-description"
            />
          </div>

          {/* QR Code Display */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center animate-pulse">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Generating QR code...</p>
                </div>
              </CardContent>
            </Card>
          ) : upiData && qrCodeUrl ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  {/* QR Code */}
                  <div className="w-48 h-48 mx-auto border rounded-lg overflow-hidden" data-testid="qr-code-display">
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Shop Details */}
                  <div className="space-y-1">
                    <p className="font-medium text-lg" data-testid="text-shop-name">
                      {upiData.shopName}
                    </p>
                    {upiData.shopNameHindi && (
                      <p className="text-gray-600 font-devanagari" data-testid="text-shop-name-hindi">
                        {upiData.shopNameHindi}
                      </p>
                    )}
                    <div className="flex items-center justify-center space-x-2">
                      <p className="text-gray-600 text-sm" data-testid="text-upi-id">
                        {upiData.upiId}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleCopyUPIId}
                        data-testid="button-copy-upi-id"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    {customAmount && (
                      <p className="text-xl font-bold text-blue-600" data-testid="text-payment-amount">
                        ₹{formatUPIAmount(parseFloat(customAmount))}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex items-center justify-center"
                      data-testid="button-share-qr"
                    >
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="flex items-center justify-center"
                      data-testid="button-print-qr"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>

                  {/* Payment Complete Button */}
                  {orderId && (
                    <Button
                      className="w-full"
                      onClick={handlePaymentComplete}
                      data-testid="button-payment-complete"
                    >
                      Mark Payment Complete
                    </Button>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Scan with any UPI app to pay
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : customAmount && parseFloat(customAmount) > 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600">Failed to generate QR code</p>
                <p className="text-sm text-gray-500 mt-1">Please check your UPI configuration</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Enter amount to generate QR code</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
