"use client";
import React, { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { QuestionMarkIcon } from "@radix-ui/react-icons";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormButton from "@/components/FormButton";

interface FormData {
  dbType: string;
  description: string;
  connectionString: string;
}

// Define database-specific placeholders and tooltips
const dbConfig = {
  mysql: {
    placeholder: "mysql://username:password@hostname:port/database",
    tooltip: "Example: mysql://username:password@hostname:port/database",
  },
  postgres: {
    placeholder: "postgresql://username:password@hostname:port/database?sslmode=no-verify",
    tooltip: "Example: postgresql://username:password@hostname:port/database?sslmode=no-verify",
  },
  mongodb: {
    placeholder: "mongodb+srv://username:password@cluster0.mongodb.net/database?retryWrites=true&w=majority",
    tooltip: "Example: mongodb+srv://username:password@cluster0.mongodb.net/database?retryWrites=true&w=majority",
  },
  sqlserver: {
    placeholder: "Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;",
    tooltip: "Example: Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;",
  },
};

const AddNewDB: React.FC = () => {
  const router = useRouter();
  const [btnLoader, setBtnLoader] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    dbType: "",
    description: "",
    connectionString: "",
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.connectionString.length < 10) {
      toast.error("Please provide a valid connection string.");
      return;
    }
    setBtnLoader(true);

    try {
      const data = {
        dbType: formData.dbType,
        description: formData.description,
        connectionString: formData.connectionString,
      };

      const response = await axios.post(
        "/api/database/connect",
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success(response.data.msg);
        router.push("/dashboard?tab=data"); // Redirect to the dashboard or another page
      } else {
        throw new Error("Failed to add database");
      }
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : (error as Error).message || "Unknown error occurred";
      console.error("Error adding database:", errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setBtnLoader(false);
    }
  };

  return (
    <div className="w-full pb-16">
      <div className="flex flex-col lg:flex-row items-center justify-center px-4 pt-8 md:pt-16">
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <h1 className="font-heading text-5xl font-semibold">
            Connect Data Source
          </h1>
          <p className="px-4 text-center mt-4 font-body text-foreground">
            Connect on-prem or cloud database
          </p>
          <form
            className="w-full px-4 md:w-[600px] mt-4"
            onSubmit={handleSubmit}
          >
            {/* Database Type Dropdown */}
            <div className="w-full mt-4">
              <Select
                name="dbType"
                value={formData.dbType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, dbType: value }))
                }
              >
                <SelectTrigger className="w-full bg-background p-5 rounded-xl border-blue-400 h-[64px] border font-body outline-none focus:ring-1 ring-blue-600">
                  <SelectValue placeholder="Select a database type (e.g., MySQL, PostgreSQL)" />
                </SelectTrigger>
                <SelectContent className="font-body">
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="postgres">PostgreSQL</SelectItem>
                  <SelectItem value="mongodb">MongoDB</SelectItem>
                  {/* <SelectItem value="sqlserver">SQL Server</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            {/* Description Input */}
            <div className="w-full mt-4">
              <input
                type="text"
                name="description"
                placeholder="Enter a description for your database (e.g., Production DB, Analytics DB)"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full bg-background p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
              />
            </div>

            {/* Connection String Textarea */}
            <div className="relative w-full mt-4">
              <textarea
                name="connectionString"
                placeholder={
                  formData.dbType
                    ? dbConfig[formData.dbType].placeholder
                    : "Enter your connection string"
                }
                rows={4}
                value={formData.connectionString}
                onChange={handleInputChange}
                className="w-full bg-background p-5 rounded-xl min-h-[200px] border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
              ></textarea>
              <div className="absolute top-5 right-3 flex items-center justify-center w-6 h-6 rounded-full border border-blue-600 text-blue-600 bg-white">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                    <button 
        type="button" // This prevents form submission
        onClick={(e) => {
          e.preventDefault(); // Extra prevention
          e.stopPropagation(); // Stops event bubbling
        }}
        className="focus:outline-none" // Removes focus ring
       >
                      <QuestionMarkIcon /></button>
                    </TooltipTrigger>
                    <TooltipContent className="flex flex-col items-center p-4 gap-4">
                      <p className="w-[300px] break-words font-body text-center">
                        {formData.dbType
                          ? dbConfig[formData.dbType].tooltip
                          : "Provide the connection string for your database."}
                      </p>
                      <a href="/Database_Connection_Guide.pdf" download={true} target="_blank" className="p-2 bg-blue-600 text-white font-body rounded hover:bg-blue-500">Download Connection Guide</a>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4 w-full flex justify-center">
              <FormButton state={btnLoader} text="Connect" />
            </div>
          </form>
        </div>
        <div className="hidden md:block database-image w-1/2 h-[400px] bg-transparent"></div>
      </div>
    </div>
  );
};

export default AddNewDB;