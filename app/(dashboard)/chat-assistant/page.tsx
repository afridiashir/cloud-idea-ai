"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Pause, SendHorizontal } from "lucide-react";
import PageLoader from "next/dist/client/page-loader";
import Loading from "@/app/loading";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let SpeechRecognition: any;
let recognition: any;

interface JSXMessage {
  sender: string;
  text: any;
  time: string;
}
interface UserDetail {
  knowledgeBaseId: string;
  apiKey: string;
  userId: string;
}

const useFetchChatCredHook = () => {
  const [loader, setLoader] = useState(true);
  const [data, setData] = useState(null);
  const response = axios.get("/api/chat-assistant/cred");

  return { loader, data };
};

const ChatComponent = ({ isUsername }: { isUsername: any }) => {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [shouldSend, setShouldSend] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [username, setName] = useState("You");
  const [userDetail, setUserDetail] = useState<UserDetail>(undefined);
  const router = useRouter();
  const [apiLoader,setApiLoader] = useState(true);

  useEffect(()=>{
    const response = axios.get('/api/chat-assistant/cred').then(res=>{

      const {knowledgeBaseId, apiKey, userId } = res.data.result;
      setUserDetail({
        knowledgeBaseId, apiKey, userId
      });
      setApiLoader(false);
    }).catch(e=>{
      console.log(e);
    })
  },[]);

  const names = ["Rosie", "Alexa", "Amanda", "Sara", "Maya"];
  const [assistantName, setAssistantName] = useState(""); // Initially empty

  const [messages, setMessages] = useState<JSXMessage[]>([
    {
      sender: assistantName || "Assistant",
      text: "Hi, I am here to assist further with the idea you generated to bring more clarity. Please share your thoughts!",
      time: getTime24HourFormat(),
    },
  ]);

  useEffect(() => {
    // Only set the assistant name after the component mounts
    const randomName = names[Math.floor(Math.random() * names.length)];
    setAssistantName(randomName);

    // Update the initial message with the assistant's name
    setMessages([
      {
        sender: randomName,
        text: "Hi, welcome its your chat assistant Go ahead and send me a message. 😄",
        time: getTime24HourFormat(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();

      recognition.interimResults = true; // Enable partial results
      recognition.maxAlternatives = 1; // Simplify transcription

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech detected:", transcript);
        setInput(transcript);
        setIsListening(false);
        setShouldSend(!shouldSend);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("Speech recognition ended.");
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") {
          console.warn("No speech detected. Please try speaking again.");
        } else {
          console.error("Speech Recognition Error:", event.error);
        }
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const initialMessage = searchParams.get("initial-message");
    if (initialMessage && typeof initialMessage === "string") {
      setInput(decodeURIComponent(initialMessage));
      setShouldSend(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (shouldSend && input.trim() !== "") {
      handleSendMessage();
    }
  }, [shouldSend]);

  function getTime24HourFormat() {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() === "") return;

    const newMessages = [
      ...messages,
      {
        sender: username != "" ? username : "You",
        text: input,
        time: getTime24HourFormat(),
      },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      setIsLoading(true); // Set loading state to true before making the request

      const response = await axios.post(
        `https://scrape.vetaai.com/api/chat/${userDetail.knowledgeBaseId}`,
        {
          message: input,
          user_id: userDetail.userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": `${userDetail.apiKey}`,
          },
        }
      );

      // Assuming the response format is { response: "your response here" }
      const { response: apiResponse } = response.data;

      if (response.status === 200) {
        const formattedResponse = formatResponse(apiResponse);
        const newMessageList = [
          ...newMessages,
          {
            sender: assistantName,
            text: formattedResponse,
            time: getTime24HourFormat(),
          },
        ];
        setMessages(newMessageList);
      } else {
        setMessages([
          ...newMessages,
          {
            sender: assistantName,
            text: "Error: Failed to fetch response.",
            time: getTime24HourFormat(),
          },
        ]);
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessages([
        ...newMessages,
        {
          sender: assistantName,
          text: "Error: Something went wrong.",
          time: getTime24HourFormat(),
        },
      ]);
    } finally {
      setIsLoading(false); // Set loading state to false after the request completes
    }
  };

  const formatResponse = (response: string) => {
    const formatted = response.split("\n").map((line, index) => (
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

    return formatted;
  };

  const startListening = () => {
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Create a new line
        const cursorPos = e.target.selectionStart;
        const textBefore = input.substring(0, cursorPos);
        const textAfter = input.substring(cursorPos);
        setInput(`${textBefore}\n${textAfter}`);
        e.target.selectionEnd = cursorPos + 1; // Move cursor to the next line
        e.preventDefault();
      } else {
        // Submit the form
        e.preventDefault(); // Prevent default Enter behavior
        handleSendMessage();
      }
    }
  };

  if(apiLoader){
    return <Loading />;
  }

  return (
    <div className="row gpt font-body  min-h-screen">
      <div className="w-full border-b px-2 lg:px-32 py-6 flex items-center gap-6">
        <Button
          variant="outline"
          className="font-body  text-body py-6 flex gap-4 bg-background text-xl"
          onClick={() => router.back()}
        >
          <ArrowLeft /> Back
        </Button>
        <h1 className="font-heading text-2xl  lg:text-4xl font-bold">Idea Assistant</h1>
      </div>
      <div className="w-full font-body min-h-full">
        <section className="msger">
          <main className="msger-chat px-2 lg:px-32" ref={chatRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`msg ${
                  msg.sender === username ? "right-msg" : "left-msg"
                }`}
              >
                <div className="msg-bubble">
                  {msg.sender === username ? (
                    <img src="/Avatar.png" />
                  ) : (
                    <img src="/chat.png" />
                  )}
                  <div className="msg-text leading-1 max-w-[80%] relative pb-4">
                    {msg.text}{" "}
                    <span className="absolute right-4 bottom-1   text-xs">
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="msg left-msg">
                <div className="msg-bubble">
                  <img src="/chat.png" />
                  <div className="msg-text typing text-foreground">
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                  </div>
                </div>
              </div>
            )}
          </main>
          <div className="px-2 lg:px-12 ">
            <form
              className="msger-inputarea relative dark:border dark:border-blue-800 "
              onSubmit={handleSendMessage}
            >
              <textarea
                className="msger-input"
                placeholder="Enter your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              >
                {input}
              </textarea>
              <div className="flex absolute bottom-2 right-2 gap-2">
                <button
                  type="button"
                  className={`msger-mic-btn ${isListening ? "listening" : ""}`}
                  onClick={isListening ? stopListening : startListening}
                >
                  {isListening ? <Pause size={20} /> : <Mic size={20} />}
                </button>
                <button
                  type="submit"
                  className="bg-primary rounded-full flex items-center text-center px-4 gap-2 text-white h-auto"
                >
                  Send <SendHorizontal size={20} />
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

const Page = () => {
  const [isUsername, setIsUsername] = useState(false);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatComponent isUsername={isUsername} />
    </Suspense>
  );
};

export default Page;
