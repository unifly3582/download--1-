'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Tag } from 'lucide-react';

interface CouponInputProps {
  orderValue: number;
  items?: Array<{ productId: string; quantity: number; price: number }>;
  customerPhone?: string;
  onCouponApplied: (couponData: {
    couponCode: string;
    discountAmount: number;
    finalAmount: number;
    couponType: string;
  }) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: {
    couponCode: string;
    discountAmount: number;
    finalAmount: number;
    couponType: string;
  } | null;
}

export function CouponInput({ 
  orderValue, 
  items = [], 
  customerPhone, 
  onCouponApplied, 
  onCouponRemoved,
  appliedCoupon 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code',
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/customer/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: couponCode.toUpperCase(),
          orderValue,
          items,
          customerPhone,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onCouponApplied({
          couponCode: couponCode.toUpperCase(),
          discountAmount: result.data.discountAmount,
          finalAmount: result.data.finalAmount,
          couponType: result.data.couponType,
        });
        
        toast({
          title: 'Coupon Applied!',
          description: `You saved ₹${result.data.discountAmount}`,
        });
        
        setCouponCode('');
      } else {
        toast({
          title: 'Invalid Coupon',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to validate coupon. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    onCouponRemoved();
    toast({
      title: 'Coupon Removed',
      description: 'Coupon has been removed from your order',
    });
  };

  const formatCurrency = (amount: number) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

  return (
    <div className="space-y-4">
      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {appliedCoupon.couponCode}
                </Badge>
                <span className="text-sm text-green-700">Applied</span>
              </div>
              <div className="text-sm text-green-600">
                You saved {formatCurrency(appliedCoupon.discountAmount)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeCoupon}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Coupon Input */}
      {!appliedCoupon && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Have a coupon code?</span>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
              className="font-mono"
              disabled={isValidating}
            />
            <Button 
              onClick={validateCoupon} 
              disabled={isValidating || !couponCode.trim()}
              className="min-w-[100px]"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                'Apply'
              )}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Enter your coupon code to get instant discount on your order
          </div>
        </div>
      )}

      {/* Order Summary with Discount */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{formatCurrency(orderValue)}</span>
        </div>
        
        {appliedCoupon && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({appliedCoupon.couponCode}):</span>
            <span>-{formatCurrency(appliedCoupon.discountAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between font-semibold text-lg border-t pt-2">
          <span>Total:</span>
          <span>
            {appliedCoupon 
              ? formatCurrency(appliedCoupon.finalAmount)
              : formatCurrency(orderValue)
            }
          </span>
        </div>
      </div>
    </div>
  );
}