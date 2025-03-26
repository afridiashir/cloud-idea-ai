"use client";
import FormButton from "@/components/FormButton";
import { Input } from "@/components/ui/input";
import axios from "axios";
import React, { useState, useEffect } from "react"; // Added useEffect
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useFetchUser } from "@/hooks/userHook";

const Page = ({ params }: { params: { id: string } }) => {
  const { data, loader } = useFetchUser(params.id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const router = useRouter();

  // Add this useEffect to initialize formData when data is loaded
  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        password: "",
      });
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/users/update`, {
        ...formData,
        id: params.id,
      });
      toast.success(response.data?.msg);
      setTimeout(() => {
        setLoading(false);
        router.push("/users");
      }, 2000);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "An error occurred.");
      setLoading(false);
      console.error(e);
    }
  };

  if (loader) {
    return (
      <div className="p-4 min-h-screen pt-12">
        <Skeleton className="w-full h-[400px] rounded mt-4" />
      </div>
    );
  }

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
      <div className="flex flex-col lg:flex-row items-center justify-around px-4 gap-48 pt-16 md:pt-16 lg:mx-32">
        <div className="w-full lg:max-w-5xl flex flex-col items-center">
          <h1 className="font-heading text-5xl font-semibold">Edit User</h1>
          <p className="px-4 text-center mt-4 font-body text-foreground">
            Update user profile details
          </p>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="w-full px-4 md:w-[600px] mt-4"
          >
            {/* Name Field */}
            <div className="w-full mb-4">
              <input
                type="text"
                name="name"
                placeholder="Enter Full Name"
                value={formData.name} // Changed from data.name to formData.name
                onChange={handleInputChange}
                className="w-full bg-background p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
              />
            </div>

            {/* Email Field */}
            <div className="w-full mb-4">
              <input
                type="email"
                name="email"
                placeholder="Enter Email Address"
                value={formData.email} // Changed from data.email to formData.email
                onChange={handleInputChange}
                className="w-full bg-background p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
              />
            </div>

            {/* Password Field */}
            <div className="w-full mb-4">
              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-background p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
              />
            </div>

            {/* Submit Button */}
            <div className="mt-4 w-full flex justify-center">
              <FormButton
                state={loading}
                text="Update User"
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