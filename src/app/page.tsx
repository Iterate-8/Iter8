"use client";

import { useState } from "react";

export default function Home() {
  const [currentUrl, setCurrentUrl] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Iter8</h1>
        <p className="text-gray-600 mb-8">Customer Feedback Platform</p>
        <div className="bg-gray-100 p-8 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">App is Working!</h2>
          <p>Authentication disabled for testing.</p>
          <p className="mt-4 text-sm text-gray-500">Current URL: {currentUrl || 'None'}</p>
        </div>
      </div>
    </div>
  );
}
