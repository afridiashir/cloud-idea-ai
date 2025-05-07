"use client";

import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, Plus, Trash } from "lucide-react";
import axios from "axios";
import IdeaContext, { useIdea } from "@/components/IdeaProvider";
import { useSidebar } from "@/components/Sidebar";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import FormButton from "@/components/FormButton";

export default function WebsiteLinks() {
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState<string>("");

  const [btnLoader, setBtnLoader] = useState(false);

  const { text, setText } = useIdea();

  const router = useRouter();

  const handleAddLink = () => {
    if (newLink.trim() !== "") {
      setLinks((prev) => [...prev, newLink]);
      setNewLink("");
    }
  };

  const handleDeleteLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setBtnLoader(true);
  
    // If there's a new link in the input, add it to the links list before submission
    if (newLink.trim() !== "") {
      setLinks((prev) => [...prev, newLink]);
      setNewLink("");
    }
  
    axios
      .post(
        "https://scrape.webspikes.com/scrape",
        {
          urls: [...links, newLink.trim()],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        setBtnLoader(false);
        setText(res.data.enhanced_text);
        router.push("/idea-generation");
      })
      .catch((error) => {
        setBtnLoader(false);
        if (axios.isAxiosError(error)) {
          console.error("Axios error:", error.message);
          toast.error(error.message);
          console.error("Response:", error.response?.data);
        } else {
          console.error("Unexpected error:", error);
        }
      });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-foreground font-heading mt-12 mb-4 text-3xl font-body font-medium flex justify-between items-center">
        Website Links
        <Button
          variant="outline"
          onClick={handleAddLink}
          className="h-[56px] flex justify-between gap-4 rounded-full text-lg"
        >
          <Plus /> Add New Links
        </Button>
      </h2>

      <div className="mt-12">
        {/* Input Field */}
        <div className="mb-6 flex gap-4 bg-background text-foreground p-4 rounded-xl border border-blue-500">
          <input
            type="text"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="Enter website link"
            className="border-none focus:outline-none w-full font-body bg-transparent text-foreground placeholder-gray-400"
          />
          <Link2 size={24} color="#368DFF" />
        </div>
        <h2 className="text-foreground font-body mt-12 mb-4 text-3xl font-body font-medium flex justify-between items-center">
          Added Links
        </h2>
        {/* Added Links */}
        <div className="space-y-4">
          {links.length > 0 ? (
            links.map((link, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border bg-background rounded-lg text-foreground shadow-sm hover:shadow-md"
              >
                <input className="text-foreground w-full mr-4  bg-background  break-all font-body" value={link} />
                  
                <button
                  onClick={() => handleDeleteLink(index)}
                  className="text-[#368DFF] hover:text-red-700 focus:outline-none"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No links added yet.</p>
          )}
        </div>
      </div>
      <div className="mt-6  max-w-xl mx-auto">
        <FormButton text="Connect" state={btnLoader} onClick={handleSubmit} className="hover:bg-blue-600 hover:text-white" />
      </div>
    </div>
  );
}
