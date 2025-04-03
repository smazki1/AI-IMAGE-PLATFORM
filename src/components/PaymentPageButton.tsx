
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PaymentPageButtonProps {
  selectedStyle: string;
  selectedSubStyle: string;
  selectedPackage: { name: string; price: number; imageCount: number } | null;
}

const PaymentPageButton: React.FC<PaymentPageButtonProps> = ({
  selectedStyle,
  selectedSubStyle,
  selectedPackage,
}) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    // Store selected options in sessionStorage
    sessionStorage.setItem(
      "selectedOptions",
      JSON.stringify({
        style: selectedStyle,
        subStyle: selectedSubStyle,
        package: selectedPackage,
      })
    );
    
    // Navigate to details page
    navigate("/details");
  };

  return (
    <Button
      onClick={handleContinue}
      className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
    >
      Continue to Details
    </Button>
  );
};

export default PaymentPageButton;
