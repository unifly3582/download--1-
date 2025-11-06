'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/firebase/client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { UploadCloud, File, X } from 'lucide-react';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  initialUrl?: string;
}

export function ImageUpload({ onUploadSuccess, initialUrl = '' }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate a stable ID for this component instance
  const [inputId] = useState(() => `file-upload-${Math.random().toString(36).substring(2, 11)}`);

  // Fallback click handler to ensure file selector opens
  const handleLabelClick = () => {
    if (!isUploading && user) {
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        input.click();
      }
    }
  };

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please upload an image smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an image file (PNG, JPG, GIF).',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          // Allow some tolerance for aspect ratio (within 5% of 1:1)
          if (Math.abs(aspectRatio - 1) > 0.05) {
            toast({
              title: 'Invalid Aspect Ratio',
              description: 'Please upload a square image (1:1 aspect ratio). Current ratio: ' + aspectRatio.toFixed(2),
              variant: 'destructive',
            });
          } else {
            setFile(file);
            handleUpload(file);
          }
        };
        img.onerror = () => {
          toast({
            title: 'Invalid Image',
            description: 'Could not load the selected image. Please try another file.',
            variant: 'destructive',
          });
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        toast({
          title: 'File Read Error',
          description: 'Could not read the selected file. Please try again.',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = (fileToUpload: File) => {
    if (!fileToUpload) return;

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to upload images.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Create a clean filename
    const timestamp = Date.now();
    const cleanFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `products/${timestamp}_${cleanFileName}`);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        let errorMessage = 'Something went wrong during upload.';

        // Provide specific error messages
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = 'You do not have permission to upload files.';
            break;
          case 'storage/canceled':
            errorMessage = 'Upload was canceled.';
            break;
          case 'storage/quota-exceeded':
            errorMessage = 'Storage quota exceeded. Please upgrade your Firebase plan or clean up existing files.';
            break;
          case 'storage/invalid-format':
            errorMessage = 'Invalid file format.';
            break;
          case 'storage/invalid-event-name':
            errorMessage = 'Invalid upload event.';
            break;
          default:
            errorMessage = `Upload failed: ${error.message}`;
        }

        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive'
        });
        setIsUploading(false);
        setUploadProgress(0);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUrl(downloadURL);
          onUploadSuccess(downloadURL);
          setIsUploading(false);
          setFile(null);
          setUploadProgress(0);
          toast({
            title: 'Upload Successful',
            description: 'Image has been uploaded successfully.'
          });
        } catch (error) {
          console.error("Failed to get download URL:", error);
          toast({
            title: 'Upload Failed',
            description: 'Failed to get image URL after upload.',
            variant: 'destructive'
          });
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    );
  };

  const handleRemoveImage = () => {
    setUrl('');
    onUploadSuccess(''); // Notify parent component that URL is cleared
  };

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-dashed border-input p-4">
        {url ? (
          <div className="relative group">
            <img src={url} alt="Uploaded image" className="w-full h-auto rounded-md" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div
              onClick={handleLabelClick}
              className={`cursor-pointer ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">
                {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                Square images (1:1 ratio), PNG/JPG/GIF up to 10MB
              </p>
            </div>
            <Input
              id={inputId}
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isUploading || !user}
              accept="image/*"
            />
            {!user && (
              <p className="text-xs text-destructive mt-2">
                Please log in to upload images
              </p>
            )}
          </div>
        )}
      </div>
      {isUploading && (
        <div className="flex items-center gap-2">
          {file && <File className="h-4 w-4 text-muted-foreground" />}
          <Progress value={uploadProgress} className="w-full" />
          <span className="text-sm font-medium">{Math.round(uploadProgress)}%</span>
        </div>
      )}
    </div>
  );
}
