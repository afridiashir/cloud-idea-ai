import React, {
  createContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useContext,
} from "react";

// Define the shape of an Idea (replace with your actual structure)
interface Idea {
  idea_id: number; // Example field, adjust as per your use case
  title: string;
  idea: string;
}

// Define the context value type
interface IdeaContextType {
  name: string | undefined;
  setName: Dispatch<SetStateAction<string | undefined>>;
  text: string | undefined;
  setText: Dispatch<SetStateAction<string | undefined>>;
  ideas: Idea[]; // Array of ideas
  setIdeas: Dispatch<SetStateAction<Idea[]>>;
  selectedIdeas: Idea[]; // Selected ideas
  setSelectedIdeas: Dispatch<SetStateAction<Idea[]>>;
  prototypeText: string | undefined;
  setPrototypeText: Dispatch<SetStateAction<string | undefined>>;
  prototypeTitle: string | undefined;
  setPrototypeTitle: Dispatch<SetStateAction<string | undefined>>;
}

// Create the context with a default value of `null`
const IdeaContext = createContext<IdeaContextType | null>(null);

// Define the props for the provider
interface IdeaProviderProps {
  children: ReactNode;
}

export const IdeaProvider: React.FC<IdeaProviderProps> = ({ children }) => {
  const [name, setName] = useState<string | undefined>(undefined);
  const [text, setText] = useState<string | undefined>(undefined);
  const [ideas, setIdeas] = useState<Idea[]>([]); // Default empty array
  const [selectedIdeas, setSelectedIdeas] = useState<Idea[]>([]);
  const [prototypeTitle, setPrototypeTitle] = useState<string | undefined>(undefined);
  const [prototypeText, setPrototypeText] = useState<string | undefined>(undefined);

  return (
    <IdeaContext.Provider
      value={{
        name,
        setName,
        text,
        setText,
        ideas,
        setIdeas,
        selectedIdeas,
        setSelectedIdeas,
        prototypeText,
        setPrototypeText,
        prototypeTitle,
        setPrototypeTitle
      }}
    >
      {children}
    </IdeaContext.Provider>
  );
};

// Custom hook to use the context
export const useIdea = (): IdeaContextType => {
  const context = useContext(IdeaContext);
  if (!context) {
    throw new Error("useIdea must be used within an IdeaProvider");
  }
  return context;
};

export default IdeaContext;
