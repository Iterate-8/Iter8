"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import Logo from "./Logo";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo />
        </div>

        {/* Auth Form */}
        <div className="bg-background p-8 rounded-lg border border-black/10 dark:border-white/10">
          <h2 className="text-gray-300 font-mono text-xl mb-6 text-center">
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            {message && (
              <div className="text-sm font-mono text-center p-2 rounded bg-gray-800 border border-gray-600">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-gray-700 text-gray-200 font-mono rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-400 font-mono text-sm hover:text-gray-300 transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 