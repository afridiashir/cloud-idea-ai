import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import FormButton from "./FormButton";
import { useIdea } from "./IdeaProvider";

interface SocialMediaCardProps {
  logo: string; // Path or URL for the logo image
  title: string; // Title of the card
}

const SocialMediaCard: React.FC<SocialMediaCardProps> = ({ logo, title }) => {
  const [btnLoader, setBtnLoader] = useState<boolean>(false);
  const [link, setLink] = useState<string>("");
  const router = useRouter();
  const {setText} = useIdea();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent form refresh
    setBtnLoader(true);

    try {
      const res = await axios.post(
        "https://scrape.webspikes.com/scrape",
        { urls: [link] },
        { headers: { "Content-Type": "application/json" } }
      );

      setBtnLoader(false);
      toast.success("Successfully processed!");
      
      setText(res.data.enhanced_text);
      router.push("/idea-generation");
    } catch (error) {
      setBtnLoader(false);
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        toast.error(error.message);
        console.error("Response:", error.response?.data);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  return (
    <div className="w-full bg-background   border-2 dark:border-blue-800 hover:shadow-lg rounded-xl flex flex-col items-center justify-center font-body p-4 lp:p-4 lg:py-10">
      <img src={logo} className="w-16" alt={`${title} Logo`} />
      <h3 className="text-2xl mt-2 font-body font-medium text-foreground">{title}</h3>
      <form
        className="w-full mt-12 flex flex-col items-center"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="w-[80%] py-2 text-md bg-background rounded-lg border outline-blue-600 border-blue-400 px-4 font-body"
          placeholder={`Enter ${title} Link`}
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <FormButton
          state={btnLoader}
          text="Connect"
          onClick={() => {}}
          className="w-[80%] h-12 text-md mt-4 bg-[rgba(106,68,255,0.2)] hover:bg-[#6A44FF] hover:text-white rounded-lg text-blue-800 border-blue-800 border"
        />
      </form>
    </div>
  );
};

export default SocialMediaCard;
