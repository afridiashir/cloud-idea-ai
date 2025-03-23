import { CodeSandboxLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import {
  File,
  Flame,
  Globe,
  History,
  LogOut,
  Menu,
  PanelLeft,
  Pyramid,
  Settings,
  Twitch,
  Twitter,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, ReactNode } from "react";
import ProfileMenu from "./ProfileMenu";

// Sidebar Context
interface SidebarContextType {
  isExpanded: boolean;
  toggleExpanded: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

// Sidebar Provider
interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
}) => {
  const [isExpanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        toggleExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

// Custom Hook to Use Sidebar Context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// Sidebar Trigger Component
export const SidebarTrigger: React.FC = () => {
  const { toggleExpanded } = useSidebar();

  return (
    <button
      onClick={toggleExpanded}
      className="mr-2"
      aria-label="Toggle Sidebar"
    >
      <Menu />
    </button>
  );
};

// Sidebar Item Props
interface SidebarItemProps {
  href: string;
  Icon: React.ReactNode;
  label: string;
}

// Sidebar Component
export const Sidebar: React.FC = () => {
  const { isExpanded, toggleExpanded } = useSidebar();
  const router = useRouter();
  const session = useSession();

  const items: SidebarItemProps[] = [
    { href: "/dashboard?tab=social", Icon: <Twitter fill="#000" />, label: "Social Media" },
    { href: "/dashboard?tab=data", Icon: <Flame fill="#000" />, label: "Data Connect" },
    {
      href: "/dashboard?tab=document",
      Icon: <File fill="#000" stroke="#fff" />,
      label: "Upload Document",
    },
    { href: "/dashboard?tab=website", Icon: <Globe fill="#000" stroke="#fff" />, label: "Website Link" },
    { href: "/architectures", Icon: <Pyramid  fill="#000" stroke="#fff" />, label: "Architecture" },
    { href: "/history", Icon: <History  />, label: "History" },
  ];

  const logout = () => {
    signOut();
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`sidebar overflow-y-auto fixed px-2 max-h-screen  top-0 h-screen transition-all duration-300 ease-in-out bg-background z-50 md:z-auto overflow-hidden text-sidebar-foreground flex flex-col justify-between ${
          isExpanded ? "left-0 w-72" : "-left-72 w-72 lg:left-0 lg:w-32"
        }`}
      >
        <div className="flex flex-col justify-between">
          {/* Logo Section */}
          <div className="w-full flex items-center justify-start gap-2 px-6 mt-4">
            <Image
              src={session.data?.user?.image == null ? '/logo.png' : session.data?.user?.image}
              width={isExpanded ? 40 : 50}
              height={isExpanded ? 40 : 50}
              alt="Logo"
              className="mt-2"
            />
            
            {isExpanded && (
              <span className="font-heading font-bold text-lg text-sidebar-foreground">
                {session.data?.user?.name}
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div
            className={`mt-24 font-heading font-medium text-sm flex flex-col gap-2`}
          >
            <ProfileMenu isExpanded={isExpanded}  />

            {items.map((item, index) => (
              <SidebarItem
                key={index}
                href={item.href}
                Icon={item.Icon}
                label={item.label}
              />
            ))}
          </div>
        </div>

        {/* Chat Image and Logout Section */}
        <div className="font-body font-medium text-sm flex flex-col gap-2 pb-2 mt-8">
          {/* Chat Section */}
          <Link
            href="/chat-assistant"
            className={`w-full flex items-center gap-2 px-4 mb-4 ${
              isExpanded ? "text-md" : "justify-center"
            }`}
          >
            <Image
              src="/chat.png"
              width={isExpanded ? 28 : 50}
              height={isExpanded ? 28 : 50}
              alt="Chat"
            />
            {isExpanded && (
              <span className=" text-sidebar-foreground font-body font-medium">
                Chat
              </span>
            )}
          </Link>

          {/* Logout Item */}
          <button onClick={logout}>
            <SidebarItem href="#" Icon={<LogOut />} label="Logout" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isExpanded ? "block lg:hidden" : "hidden"
        }`}
        onClick={toggleExpanded}
      />
    </>
  );
};

// Sidebar Item Component
export const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  Icon,
  label,
}) => {
  const { isExpanded } = useSidebar();

  return (
    <Link
      href={href}
      className={`w-full py-2 rounded flex items-center font-body font-medium hover:bg-gray-200 dark:hover:bg-gray-800 ${
        isExpanded ? "flex-row px-4 gap-2" : "flex-col gap-1"
      }`}
    >
      {Icon}
      <span className={`text-center`}>{label}</span>
    </Link>
  );
};
