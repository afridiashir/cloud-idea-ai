"use client";
import React, { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FormButton from "@/components/FormButton";

interface FormData {
  name: string;
  email: string;
  password: string;
}

const Page: React.FC = () => {
  const router = useRouter();
  const [btnLoader, setBtnLoader] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setBtnLoader(true);

    try {
      const response = await axios.post("/api/users/create", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data) {
        toast.success("User created successfully!");
        router.push("/users"); // Redirect after successful creation
      }
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : (error as Error).message || "Unknown error occurred";
      console.error("Error creating user:", errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setBtnLoader(false);
    }
  };

  return (
    <div className="w-full pb-16 min-h-screen">
      {/* Header Section */}
      <div className="w-full border-b px-2 lg:px-16 py-6 flex items-center gap-6">
        <Button
          variant="outline"
          className="font-body py-6 flex gap-4 bg-background text-xl"
          onClick={() => router.back()}
        >
          <ArrowLeft /> Back
        </Button>
        <h1 className="font-heading text-2xl lg:text-4xl font-bold">Users</h1>
      </div>

      {/* Form Section */}
      <div className="flex flex-col lg:flex-row items-center justify-center px-4 gap-48 pt-16 md:pt-16 lg:mx-32">
        <div className="w-full lg:max-w-5xl flex flex-col items-center">
          <h1 className="font-heading text-5xl font-semibold">Create New User</h1>
          <p className="px-4 text-center mt-4 font-body text-foreground">
            Add a new user profile to your company
          </p>

          {/* Form */}
          <form className="w-full px-4 md:w-[600px] mt-4" onSubmit={handleSubmit}>
            {/* Name Input */}
            <input
              type="text"
              name="name"
              placeholder="Enter Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-background p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
            />

            {/* Email Input */}
            <input
              type="email"
              name="email"
              placeholder="Enter Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-background mt-4 p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
            />

            {/* Password Input */}
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-background mt-4 p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
            />

            {/* Submit Button */}
            <div className="mt-4 w-full flex justify-center">
              <FormButton
                state={btnLoader}
                text="Create User"
                onClick={handleSubmit}
                className="hover:bg-blue-600 hover:text-white"
              />
            </div>
          </form>
        </div>

        {/* Placeholder for Image or Additional Content */}
        <div className="hidden md:block create-user-image w-full h-[400px] bg-transparent"></div>
      </div>
    </div>
  );
};

export default Page;