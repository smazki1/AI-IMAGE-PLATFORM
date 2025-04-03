
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { supabaseClient } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import ImageUploadPreview from "@/components/ImageUploadPreview";
import { User, Mail, Upload } from "lucide-react";

const DetailsPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.gender) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (files.length < 5) {
      toast({
        title: "Not enough images",
        description: "Please upload at least 5 images",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Generate a unique order ID
      const order_id = uuidv4();
      
      // Upload each file to Supabase Storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${order_id}-${i}.${fileExt}`;
        
        const { error } = await supabaseClient.storage
          .from('user-images')
          .upload(fileName, file);
          
        if (error) {
          throw new Error(`Error uploading image ${i}: ${error.message}`);
        }
      }
      
      // Store form data in session storage for the payment page
      sessionStorage.setItem('orderDetails', JSON.stringify({
        ...formData,
        order_id,
        imageCount: files.length,
      }));
      
      // Redirect to payment page
      navigate('/payment', { state: { order_id } });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Your Details</h1>
      
      <Card className="max-w-2xl mx-auto p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User size={18} />
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail size={18} />
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2">
              <User size={18} />
              Gender
            </Label>
            <Select value={formData.gender} onValueChange={handleGenderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="woman">Woman</SelectItem>
                <SelectItem value="man">Man</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="images" className="flex items-center gap-2">
              <Upload size={18} />
              Upload Images (minimum 5)
            </Label>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-50 transition-colors cursor-pointer">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">Drag & drop your images here or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">
                  {files.length} image{files.length !== 1 ? 's' : ''} selected
                </p>
              </label>
            </div>
            
            {files.length > 0 && (
              <ImageUploadPreview files={files} removeFile={removeFile} />
            )}
            
            {files.length > 0 && files.length < 5 && (
              <p className="text-sm text-amber-600">
                Please upload at least {5 - files.length} more image{5 - files.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Continue to Payment"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default DetailsPage;
