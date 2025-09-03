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
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-brand-200 text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo />
        </div>

        {/* Auth Form */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-xl border border-brand-200 shadow-sm">
          <h2 className="text-brand-600 font-sans text-xl mb-6 text-center">
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
                className="w-full p-3 bg-white border border-brand-300 rounded font-sans text-foreground placeholder-brand-400/80 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div>
              <input
                type="text"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="Startup name you're testing"
                required
                className="w-full p-3 bg-white border border-brand-300 rounded font-sans text-foreground placeholder-brand-400/80 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-foreground/70 font-sans text-sm mb-2">I am a:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("customer")}
                  className={`p-3 rounded border font-sans transition-colors ${
                    userType === "customer"
                      ? 'bg-brand-100 border-brand-300 text-foreground'
                      : 'bg-white border-brand-300 text-foreground/70 hover:bg-brand-50'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("company")}
                  className={`p-3 rounded border font-sans transition-colors ${
                    userType === "company"
                      ? 'bg-brand-100 border-brand-300 text-foreground'
                      : 'bg-white border-brand-300 text-foreground/70 hover:bg-brand-50'
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
                className="w-full p-3 bg-white border border-brand-300 rounded font-sans text-foreground placeholder-brand-400/80 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {message && (
              <div className="text-sm font-sans text-center p-2 rounded bg-brand-100 border border-brand-300 text-foreground">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-primary text-white font-sans rounded hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-foreground/70 font-sans text-sm hover:text-foreground transition-colors"
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