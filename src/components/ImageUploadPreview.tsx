
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadPreviewProps {
  files: File[];
  removeFile: (index: number) => void;
}

const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({ files, removeFile }) => {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Image Preview</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {files.map((file, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square overflow-hidden rounded-md border border-gray-200">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index}`}
                className="h-full w-full object-cover transition-all hover:scale-105"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeFile(index)}
            >
              <X size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploadPreview;
