"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import IdeaBar from "@/components/IdeaBar";
import toast from "react-hot-toast";
import Link from "next/link";
import axios from "axios";
import { useIdea } from "@/components/IdeaProvider";
import { Skeleton } from "@/components/ui/skeleton";
import Tour from "@/components/Tours";
import { ideaPrototypePageSteps } from "@/components/tour";
import FormButton from "@/components/FormButton";

// Interface for card data
interface Card {
  description: string;
  link: string;
}

// InfoCard Component Props
interface InfoCardProps {
  card: Card;
}

// Page Component
const Page: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { prototypeText,name,prototypeTitle } = useIdea();
  
    const [saveBtnLoader, setSaveBtnLoader] = useState(false);

  // Fetch cards from the API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "https://idea.vetaai.com/search",
          { idea: prototypeText },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        setCards(response.data.results || []);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to fetch data. Please try again.");
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  
  const handleSaveIdea = (e:any) => {
    setSaveBtnLoader(true);
    const response = axios
      .post("/api/idea/save", {
        name: name,
        title: prototypeTitle,
        description: prototypeText,
        prototype: JSON.stringify(cards)
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
    <div className="w-full pb-16  min-h-screen">
      <IdeaBar menu="prototype" />
      <div className="w-full mt-4">
        <div className="w-full flex justify-between px-6 gap-[480px]">
          <Button
            variant="outline"
            className="font-body  text-body py-6 flex gap-4 bg-background text-xl"
            onClick={() => router.back()}
            aria-label="Go Back"
          >
            <ArrowLeft /> Back
          </Button>
          
        <FormButton
          text="Save Prototype"
          state={saveBtnLoader}
          onClick={handleSaveIdea}
          className="w-[200px] text-lg font-body  hover:bg-white px-32 hover:text-blue-600 bg-blue-600 text-white"
        />
        </div>
        <div className="flex justify-center flex-col items-center mt-4">
          <h1 className="font-heading font-bold text-6xl">
            Prototype & Components
          </h1>
          <p className="font-body mt-4 text-lg">
            A list or grid view showing potential partners or components
            relevant to the selected idea.
          </p>
        </div>
        
        {loading ? (
          
          <div className="gap-4 mt-8 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mx-32">
            <Skeleton className="w-full h-[300px]  bg-gray-100 " />
            <Skeleton className="w-full h-[300px]  bg-gray-100 " />
            <Skeleton className="w-full h-[300px]  bg-gray-100 " />
            <Skeleton className="w-full h-[300px] bg-gray-100 " />
            </div>
        ) : cards.length > 0 ? (
          <div className="gap-4 mt-8 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mx-32">
            {cards.map((card, index) => (
              <ProtoTypeCard key={index} card={card} />
            ))}
          </div>
        ) : (
          <p className="text-center text-lg">No results found.</p>
        )}
      </div>
      
      <Tour pageSteps={ideaPrototypePageSteps} />
    </div>
  );
};

// InfoCard Component
const ProtoTypeCard: React.FC<InfoCardProps> = ({ card }) => {
  function getDomainName(link) {
    try {
      const url = new URL(link);
      return url.hostname; // Returns the domain name
    } catch (error) {
      console.error("Invalid URL:", error);
      return null;
    }
  }

  return (
    <div className="p-4 w-full border rounded-xl font-body shadow-md bg-background relative pb-24">
      <div className="flex justify-between items-start">
        <h3 className="text-md font-semibold text-blue-600 break-words">
          {getDomainName(card.link)}
        </h3>
        <a
          href={card.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
          aria-label="Open in new tab"
        >
          <ArrowTopRightIcon />
        </a>
      </div>
      <p className="mt-2 text-foreground text-sm mb-4">{card.description}</p>
      <Link href={card.link} className="absolute bottom-4" target="_blank">
        <button className="bg-primary px-10 text-xl py-2 rounded-full text-white border-2 border-blue-600 hover:bg-blue-700 hover:text-white">
          Visit
        </button>
      </Link>
    </div>
  );
};

export default Page;
