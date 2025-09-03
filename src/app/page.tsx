"use client";

import { useAuth } from "../components/AuthProvider";
import { useUserRole } from "../hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Logo from "../components/Logo";

export default function Home() {
  const { user, loading } = useAuth();
  const { isCompanyMember, loading: roleLoading } = useUserRole();
  const router = useRouter();

  console.log('Home page state:', { user: !!user, loading, roleLoading, isCompanyMember });

  useEffect(() => {
    if (!loading && !roleLoading && user) {
      console.log('Routing decision:', isCompanyMember ? 'company' : 'customer');
      console.log('User metadata:', user.user_metadata);
      console.log('User type from metadata:', user.user_metadata?.user_type);
      
      if (isCompanyMember) {
        console.log('Routing to company dashboard...');
        router.push('/company');
      } else {
        console.log('Routing to customer dashboard...');
        router.push('/customer');
      }
    }
  }, [user, loading, roleLoading, isCompanyMember, router]);

  if (loading || roleLoading) {
  return (
      <div className="min-h-screen bg-white text-foreground flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <div className="mt-4 text-foreground/60 font-sans">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-white text-foreground flex items-center justify-center">
      <div className="text-center">
        <Logo />
        <div className="mt-4 text-foreground/60 font-sans">Redirecting...</div>
      </div>
    </div>
  );
}
