"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import IdeaBar from "@/components/IdeaBar";
import { useIdea } from "@/components/IdeaProvider";
import { Button } from "@/components/ui/button";
import { QuestionMarkIcon } from "@radix-ui/react-icons";
import FormButton from "@/components/FormButton";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Tour from "@/components/Tours";
import { ideaGenerationPageSteps } from "@/components/tour";

interface FormData {
  ideaName: string;
  category: string;
  concept: string;
  enhanced_text?: string;
}

interface ApiResponse {
  data: {
    ideas?: string;
  };
}

interface Idea {
  idea_id: number;
  title: string;
  idea: string;
}

const Page: React.FC = () => {
  const { text, setIdeas,setName } = useIdea();
  const router = useRouter();

  

  const [btnLoader, setBtnLoader] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    ideaName: "",
    category: "",
    concept: "",
    enhanced_text: text,
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

  const convertToJSON = (input: string): Idea[] => {
    const sections = input.trim().split("\n\n");
    return sections.map((section, index) => {
      const [titleLine, ...descriptionLines] = section.split("\n");
      const title = titleLine.replace("Title: ", "").trim();
      const description = descriptionLines.join(" ").trim();
      return {
        idea_id: index + 1,
        title,
        idea: description,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.concept.length < 20) {
      toast.error("Please provide a concept with at least 20 characters.");
      return;
    }
    setBtnLoader(true);

    try {
      const data = {
        idea_type: formData.category,
        short_description: formData.concept,
        text_data: formData.enhanced_text,
      };

      const response: ApiResponse = await axios.post(
        "https://idea.vetaai.com/api/v1/generate-ideas",
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data?.ideas) {
        const enhance_ideas = convertToJSON(response.data.ideas);
        setIdeas(enhance_ideas);
        setName(formData.ideaName);

        router.push("/idea-list");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : (error as Error).message || "Unknown error occurred";
      console.error("Error generating idea:", errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setBtnLoader(false);
    }
  };

  return (
    <div className="w-full pb-16  min-h-screen">
      <IdeaBar menu="generation" />
      <div className="flex flex-col lg:flex-row items-center justify-center px-4 gap-48 pt-16 md:pt-32">
        <div className="    flex flex-col items-center">
          <h1 className="font-heading text-5xl font-semibold">
            Generate Ideas
          </h1>
          <p className=" px-4 text-center mt-4 font-body text-foreground">
            Brainstorm new ideas for your business in a few seconds.
          </p>
          <form
            className="w-full px-4 md:w-[600px] mt-4"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              name="ideaName"
              placeholder="Enter Idea Name"
              value={formData.ideaName}
              onChange={handleInputChange}
              className="w-full bg-background p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
            />
            <input
              type="text"
              name="category"
              placeholder="Enter Idea Type"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full bg-background mt-4 p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
            />
            <div className="relative w-full mt-4">
              <textarea
                name="concept"
                placeholder="Provide your product/services concept here..."
                rows={8}
                minLength={20}
                value={formData.concept}
                onChange={handleInputChange}
                className="w-full bg-background p-5 rounded-xl border-blue-400 border font-body outline-none focus:ring-1 ring-blue-600"
              ></textarea>
              <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full border border-blue-600 text-blue-600 bg-white">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                    <QuestionMarkIcon /></TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[300px] break-words font-body">Provide a clear and detailed description focusing on the key aspects of your idea. Include specific goals, relevant details, and any desired style or context to ensure accurate results.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

              </div>
            </div>
            <div className="mt-4 w-full flex justify-center">
              <FormButton
                state={btnLoader}
                text="Generate Idea"
                onClick={handleSubmit}
                className="hover:bg-blue-600 hover:text-white"
              />
            </div>
          </form>
        </div>
        <div className="hidden md:block generation-image w-[500px] h-[400px] bg-transparent"></div>
      </div>
      <Tour pageSteps={ideaGenerationPageSteps} />
    </div>
  );
};

export default Page;
