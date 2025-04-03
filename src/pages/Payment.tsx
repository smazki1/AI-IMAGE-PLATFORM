
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<any>(null);
  
  useEffect(() => {
    // Retrieve data from sessionStorage
    const orderDetailsStr = sessionStorage.getItem("orderDetails");
    const selectedOptionsStr = sessionStorage.getItem("selectedOptions");
    
    if (!orderDetailsStr) {
      navigate("/details");
      return;
    }
    
    setOrderDetails(JSON.parse(orderDetailsStr));
    
    if (selectedOptionsStr) {
      setSelectedOptions(JSON.parse(selectedOptionsStr));
    }
  }, [navigate]);
  
  if (!orderDetails) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Complete Your Payment</h1>
      
      <Card className="max-w-2xl mx-auto p-6 shadow-lg">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
            <p><strong>Order ID:</strong> {orderDetails.order_id}</p>
            <p><strong>Name:</strong> {orderDetails.name}</p>
            <p><strong>Email:</strong> {orderDetails.email}</p>
            <p><strong>Images:</strong> {orderDetails.imageCount}</p>
            {selectedOptions && (
              <>
                <p><strong>Style:</strong> {selectedOptions.style}</p>
                <p><strong>Sub-Style:</strong> {selectedOptions.subStyle}</p>
                <p><strong>Package:</strong> {selectedOptions.package?.name} (₪{selectedOptions.package?.price})</p>
              </>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            {/* Payment processing form would go here */}
            <div className="bg-gray-100 p-4 rounded-md text-center">
              <p>Payment integration will be implemented here</p>
            </div>
          </div>
          
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              alert("Payment processing would happen here");
              // After payment processing, call the start-training edge function
              // with the order_id and other details
            }}
          >
            Pay Now (₪{selectedOptions?.package?.price || "120"})
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentPage;
