"use client";

import React, { useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, CircleDashed, Pencil, Snowflake } from "lucide-react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import FormButton from "@/components/FormButton";
import IdeaBar from "@/components/IdeaBar";
import { useIdea } from "@/components/IdeaProvider";
import Markdown from "react-markdown";
import toast from "react-hot-toast";
import { Description } from "@radix-ui/react-dialog";
import Tour from "@/components/Tours";
import { ideaRefinementPageSteps } from "@/components/tour";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Interface for card data
interface Card {
  idea_id: number;
  title: string;
  idea: string;
}

// Interface for the API response
interface RefineIdeaResponse {
  refined_idea: string;
}

// InfoCard Component Props
interface InfoCardProps {
  card: Card;
  isSelected: boolean;
  onSelect: (card: Card) => void;
}

// InfoCard Component
const InfoCard: React.FC<InfoCardProps> = ({ card, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(card)}
    className={`relative w-full lg:max-w-sm p-6 bg-background border rounded-2xl shadow-lg cursor-pointer ${
      isSelected ? "border-blue-600 ring-2 ring-blue-400  shadow-card" : "border-blue-400"
    }`}
  >
    <div className="flex justify-between items-start">
      <h3 className="text-lg font-semibold text-blue-600">{card.title}</h3>
      <a
        href="#"
        className="text-blue-600 hover:text-blue-800"
        aria-label="Open in new tab"
      >
        <ArrowTopRightIcon />
      </a>
    </div>
    <p className="mt-2 text-sm text-foreground">{card.idea}</p>
    <button
      className="absolute right-4 -bottom-4 p-2 bg-blue-700 rounded-full border border-blue-400 text-white shadow hover:bg-blue-200"
      aria-label="Copy content"
      onClick={() => {
        navigator.clipboard.writeText(`Title: ${card.title} Idea: ${card.idea}`);
        toast.success("Idea Copied!");
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M16 16h2a2 2 0 002-2V10a2 2 0 00-2-2h-8M16 12V6M8 8h4"
        />
      </svg>
    </button>
  </div>
);

// Page Component
const Page: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [refineBtnLoader, setRefineBtnLoader] = useState(false);
  const [prototypeBtnLoader, setPrototypeBtnLoader] = useState(false);
  const [diagramBtnLoader, setDiagramBtnLoader] = useState(false);
  const [chatBtnLoader, setChatBtnLoader] = useState(false);
  const [saveBtnLoader, setSaveBtnLoader] = useState(false);
  const { selectedIdeas, setPrototypeText,name, setPrototypeTitle } = useIdea();
  const cards: Card[] = selectedIdeas || []; // Ensure cards is always an array.
  const router = useRouter();


  const [editIdea, setEditIdea] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setEditIdea(card.idea);
  };

  const handleSaveEdit = () => {
    if (selectedCard) {
      setSelectedCard((prev) =>
        prev ? { ...prev, title: prev.title, idea: editIdea } : null
      );
      setIsEditOpen(false);
    }
  };

  const handleNext = () => {
    console.log("Selected Card:", selectedCard);
  };

  const formatResponse = (response: string) => {
    return response.split("\n").map((line, index) => (
      <span key={index}>
        {line.split(/(https?:\/\/[^\s]+|\*\*[^*]+\*\*)/g).map((part, i) => {
          if (part.match(/https?:\/\/[^\s]+/)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "blue", textDecoration: "underline" }}
              >
                {part}
              </a>
            );
          }
          if (part.match(/\*\*[^*]+\*\*/)) {
            const boldText = part.slice(2, -2);
            return <strong key={i}>{boldText}</strong>;
          }
          return part;
        })}
        <br />
      </span>
    ));
  };

  const handleIdeaRefine = async () => {
    setRefineBtnLoader(true);
    if (selectedCard) {
      try {
        const response = await axios.post<RefineIdeaResponse>(
          "https://idea.webspikes.com/api/v1/refine-idea",
          { idea_text: selectedCard.idea },
          { headers: { "Content-Type": "application/json" } }
        );

        setSelectedCard((prev) =>
          prev
            ? { ...prev, idea: response.data.refined_idea } // Ensure it's a string
            : null
        );
        
    setEditIdea(selectedCard.idea);

        toast.success("Idea refined successfully!");
      } catch (error) {
        console.error("Error refining idea:", error);
        toast.error("Failed to refine idea. Please try again.");
      } finally {
        setRefineBtnLoader(false);
      }
    } else {
      setRefineBtnLoader(false);
      toast.error("Please select an idea to refine.");
    }
  };

  const handleIdeaPrototype = () => {
    setPrototypeBtnLoader(true);
    if(selectedCard.idea !== null){

      setPrototypeText(selectedCard.idea);
      setPrototypeTitle(selectedCard.title);
      router.push("/idea-prototype");
      
    setPrototypeBtnLoader(false);
    }else{
      
    setPrototypeBtnLoader(false);
      toast.error("Please select an Idea");
    }
  };

  
  const handleIdeaArchitecture = () => {
    // setPrototypeBtnLoader(true);
    if(selectedCard.idea !== null){

      setPrototypeText(selectedCard.idea);
      setPrototypeTitle(selectedCard.title);
      router.push("/idea-architecture");
      
    // setPrototypeBtnLoader(false);
    }else{
      
    // setPrototypeBtnLoader(false);
      toast.error("Please select an Idea");
    }
  };

  const handleChat = () => {
    setChatBtnLoader(true);
    const response = axios
      .post("/api/chat-assistant", {
        text: selectedCard.idea,
      })
      .then((res) => {
        console.log(res);
        toast.success("Chat Idea Initialized");
        setChatBtnLoader(false);
        router.push("/chat-assistant");
      })
      .catch((e) => {
        console.log(e);
        setChatBtnLoader(false);
        toast.error("Something Went Wrong!");
      });
      
  };


  const handleSaveIdea = () => {
    setSaveBtnLoader(true);
    const response = axios
      .post("/api/idea/save", {
        name: name,
        title: selectedCard.title,
        description : selectedCard.idea

      })
      .then((res) => {
        console.log(res);
        toast.success(res.data.message);
        
    setSaveBtnLoader(false);
      })
      .catch((e) => {
        console.log(e);
        setSaveBtnLoader(false);
        toast.error(e.response.data.error);
      });
      
  };

  return (
    <div className="w-full min-h-screen pb-16">
      <IdeaBar menu="refinement" />
      <div className="w-full mt-4">
        <div className="w-full flex px-6 gap-[480px]">
          <Button
            variant="outline"
            className="font-body py-6 flex gap-4 bg-background text-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft /> Back
          </Button>
        </div>
        <div className="flex justify-between gap-2 flex-col lg:flex-row">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 row-span-8 p-6 font-body w-full lg:w-1/2 lg:border-r border-gray-600">
            {cards.map((card) => (
              <InfoCard
                key={card.idea_id}
                card={card}
                isSelected={selectedCard?.idea_id === card.idea_id}
                onSelect={handleCardSelect}
              />
            ))}
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-end p-6">
          <div className="flex justify-end gap-4 font-body">
          <Button  className={`h-14 text-white text-md hover:bg-blue-600 hover:text-white `}  onClick={() => setIsEditOpen(true)}><Pencil size={94}/>Edit Idea</Button>
          <Button  className={`h-14 text-white text-md hover:bg-blue-600 hover:text-white ${saveBtnLoader ? 'animate-pulse' : ''}`} disabled={saveBtnLoader} onClick={handleSaveIdea}><Bookmark size={94}/>Save Idea</Button>
            <Button variant="outline" className={`h-14 ${diagramBtnLoader ? 'animate-pulse' : ''}`} onClick={handleIdeaArchitecture}>
              <span className="text-xl">
                <Snowflake size={36} />
              </span>
              Generate Diagram
            </Button>
          </div>
            <div className="w-full mt-6 bg-background p-4 rounded-lg border border-2 border-blue-400 font-body min-h-[400px] max-h-[400px] overflow-y-auto">
              <h2 className="text-xl font-semibold font-heading text-blue-700">
                {selectedCard?.title || "No idea selected"}
              </h2>
              <p className="mt-2 text-foreground">
                {selectedCard?.idea
                  ? formatResponse(selectedCard?.idea)
                  : "Please select a idea to see the details."}
              </p>
            </div>
            <div className="w-full flex flex-col md:flex-row justify-end mt-6 gap-4">
              <FormButton
                state={refineBtnLoader}
                text="Idea Refine"
                onClick={handleIdeaRefine}
                className="w-full md:w-2/5 h-16 hover:bg-blue-600 hover:text-white"
              />
              <FormButton
                state={prototypeBtnLoader}
                text="Prototype"
                onClick={handleIdeaPrototype}
                className="w-full md:w-2/5 h-16 hover:bg-blue-600 hover:text-white"
              />
              <Button
                className={`w-full bg-primary font-body hover:bg-blue-500 text-primary border-primary border h-16 lg:w-1/5 text-xl rounded-xl  ${chatBtnLoader && 'animate-pulse'}`}
                disabled={chatBtnLoader} // Disable the button when `state` is true
                onClick={handleChat} // Attach the onClick handler
              >
                <Image src="/chat.png" width={50} height={50} alt="Chat" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="font-body max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle>{selectedCard?.title ? selectedCard.title : 'Edit Idea'}</DialogTitle>
          </DialogHeader>
          <Textarea value={editIdea} onChange={(e) => setEditIdea(e.target.value)} placeholder="Idea description" className="h-[300px] text-2xl outline-none" />
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Tour pageSteps={ideaRefinementPageSteps} />
    </div>
  );
};

export default Page;
