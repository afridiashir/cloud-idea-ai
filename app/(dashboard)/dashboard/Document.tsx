import { Trash2, Upload } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import { useIdea } from "@/components/IdeaProvider";
import { useRouter } from "next/navigation";

interface Document {
  id: number;
  name: string;
  size: string;
  date: string;
  file: File; // Store the actual File object for upload
}

const DocumentUploader = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false); // Track upload state
  const [error, setError] = useState<string | null>(null);
  const [btnLoader,setBtnLoader] = useState(false);
  const router = useRouter();

  const {setText} = useIdea();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const uploadedFiles = Array.from(event.target.files).map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        date: new Date().toLocaleDateString(),
        file, // Store the file object
      }));
      setDocuments((prev) => [...prev, ...uploadedFiles]);
    }
  };

  const handleDelete = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleUpload = async () => {
    if (documents.length === 0) {
      setError("No documents to upload.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    documents.forEach((doc) => {
      formData.append("files", doc.file); // Append each file to FormData
    });

    try {
      const response = await axios.post("https://scrape.webspikes.com/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

const combinedText = Object.values(response.data).join(' ');
      console.log("Upload successful:", combinedText);
      setText(combinedText);
      router.push('/idea-generation');
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload documents.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-6 font-body">
      <h1 className="text-foreground mt-12 mb-4 text-3xl font-body font-medium font-heading">
        Add Document
      </h1>
      <div className="flex flex-col items-center max-w-4xl mx-auto">
        <div className="p-3 bg-background rounded-xl w-full">
          <div className="border m-5 border-blue-400 rounded-xl p-6 text-center mb-6">
            <label
              htmlFor="file-upload"
              className="cursor-pointer hover:underline font-body flex justify-center items-center gap-4"
            >
              <Upload /> Upload any public or private docs
            </label>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.docx,.txt" // Restrict file types
            />
          </div>
        </div>
        <div className="mt-4 w-full">
          {documents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="relative bg-background border border-blue-500 rounded-xl p-4 flex flex-col items-center"
                >
                  <div className="w-20 py-8 bg-red-100 mb-4 text-red-500 flex items-center justify-center rounded mb-8">
                    <span className="font-bold text-lg uppercase">
                      {doc.name.split(".").pop()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-center mb-3 break-words">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.date} / {doc.size}
                  </p>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="absolute top-2 right-2 text-blue-300 hover:text-red-700"
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? "Uploading..." : "Continue"}
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        
      </div>
    </div>
  );
};

export default DocumentUploader;
