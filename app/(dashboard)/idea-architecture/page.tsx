"use client";

import React, { useState, useEffect, useId } from "react";
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

// Interface for the API response
interface DiagramResponse {
  imageUrl: string;
  createEraserFileUrl: string;
  diagrams: {
    diagramType: string;
    code: string;
  }[];
}
interface DiagramDummyResponse {
  imageUrl: string;
  // createEraserFileUrl: string;
  // diagrams: {
  //   diagramType: string;
  //   code: string;
  // }[];
}

// Page Component
const Page: React.FC = () => {
  const [diagramData, setDiagramData] = useState<
    DiagramResponse | null | DiagramDummyResponse
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { name, prototypeText, prototypeTitle } = useIdea();

  const [saveBtnLoader, setSaveBtnLoader] = useState(false);

  console.log(prototypeText);

  // Fetch diagram data from the API
  useEffect(() => {
    const fetchDiagramData = async () => {
      try {
        setLoading(true);
        // const response = await axios.post("/api/architecture",{
        //   text: prototypeText
        // });
        // setDiagramData(response.data.data);

        // console.log(response);
        setDiagramData({
          imageUrl:
            "https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A24ab78b602d6a35fccf7c1529cc1fcb91f2c9b6fc1d4f580ed42e7106c9dd959.png",
        });
        setLoading(false);
      } catch (error) {
        toast.error("Failed to fetch diagram data. Please try again.");
        setLoading(false);
      }
    };

    fetchDiagramData();
  }, [prototypeText]);

  const handleSaveIdea = (e:any) => {
    setSaveBtnLoader(true);
    const response = axios
      .post("/api/idea/save", {
        name: name,
        title: prototypeTitle,
        description: prototypeText,
        architecture: diagramData.imageUrl,
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
    <div className="w-full pb-16 min-h-screen">
      <div className="w-full border-b px-2 lg:px-32 py-6 flex justify-between items-center gap-6">
        <Button
          variant="outline"
          className="font-body py-6 flex gap-4 bg-background text-xl"
          onClick={() => router.back()}
        >
          <ArrowLeft /> Back
        </Button>
        <h1 className="font-heading text-2xl  lg:text-4xl font-bold">
          MVP Architecture
        </h1>
        <FormButton
          text="Save Architecture"
          state={saveBtnLoader}
          onClick={handleSaveIdea}
          className="w-[200px] text-lg font-body  hover:bg-white px-32 hover:text-blue-600 bg-blue-600 text-white"
        />
      </div>
      <div className="px-32">
        {loading ? (
          <Skeleton className=" h-[800px] bg-gray-100" />
        ) : diagramData ? (
          <div className="mt-8 px-6 mx-32">
            <div className="flex flex-col items-center padding overflow-scroll relative  h-[800px] gap-4">
              {/* Display the diagram image */}
              <img
                src={diagramData.imageUrl}
                alt="Architecture Diagram"
                height={400}
                className=" rounded-lg shadow-lg w-full "
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-lg">No Architecture found.</p>
        )}
      </div>
    </div>
  );
};

export default Page;
