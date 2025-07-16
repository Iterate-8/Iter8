"use client";

import { useAuth } from "../components/AuthProvider";
import FeedbackBox from "../components/FeedbackBox";
import EmbedCanvas from "../components/EmbedCanvas";
import Logo from "../components/Logo";
import AuthPage from "../components/AuthPage";
import ProfileDropdown from "../components/ProfileDropdown";
import { useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [currentUrl, setCurrentUrl] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <div className="mt-4 text-gray-400 font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Left: Feedback */}
      <aside className="w-1/3 min-w-[320px] max-w-md flex flex-col border-r border-black/10 dark:border-white/10 p-6">
        {/* Logo at top */}
        <div className="mb-8">
          <Logo />
        </div>
        
        {/* Feedback at bottom */}
        <div className="flex-1 flex flex-col justify-end">
          <FeedbackBox currentUrl={currentUrl} />
        </div>
      </aside>
      
      {/* Right: Embedded Canvas */}
      <main className="flex-1 flex items-stretch relative">
        {/* Profile Dropdown - Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <ProfileDropdown />
        </div>
        
        <EmbedCanvas onUrlChange={setCurrentUrl} />
      </main>
    </div>
  );
}
