"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import Logo from "./Logo";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [startupName, setStartupName] = useState("");
  const [userType, setUserType] = useState<"customer" | "company" | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Validate user type is selected
      if (!userType) {
        throw new Error("Please select whether you're a customer or company member");
      }

      // Validate startup name is provided for both sign in and sign up
      if (!startupName.trim()) {
        throw new Error("Please enter the startup name you're testing");
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              startup_name: startupName.trim(),
              user_type: userType
            }
          }
        });
        if (error) throw error;
        console.log('Successfully signed up with metadata:', { startup_name: startupName.trim(), user_type: userType });
        setMessage("Check your email for the confirmation link!");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        // Update user metadata with startup name and user type for existing users
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            startup_name: startupName.trim(),
            user_type: userType
          }
        });
        if (updateError) {
          console.warn('Could not update user metadata:', updateError);
        } else {
          console.log('Successfully updated user metadata with:', { startup_name: startupName.trim(), user_type: userType });
        }
        
        // Force a page reload to ensure the new metadata is picked up
        window.location.reload();
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
                type="text"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="Startup name you're testing"
                required
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-gray-400 font-mono text-sm mb-2">I am a:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("customer")}
                  className={`p-3 rounded border font-mono transition-colors ${
                    userType === "customer"
                      ? 'bg-gray-700 border-gray-500 text-gray-200'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("company")}
                  className={`p-3 rounded border font-mono transition-colors ${
                    userType === "company"
                      ? 'bg-gray-700 border-gray-500 text-gray-200'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                >
                  Company Member
                </button>
              </div>
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