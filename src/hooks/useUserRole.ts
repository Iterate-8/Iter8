import { useAuth } from "../components/AuthProvider";
import { useState, useEffect } from "react";

export const useUserRole = () => {
  const { user } = useAuth();
  const [isCompanyMember, setIsCompanyMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsCompanyMember(false);
      setLoading(false);
      return;
    }

    // Role detection based on user metadata
    const checkUserRole = () => {
      const userType = user.user_metadata?.user_type;
      
      console.log('User metadata:', user.user_metadata);
      console.log('User type from metadata:', userType);
      
      // If user_type is set in metadata, use that
      if (userType === 'company') {
        console.log('Setting as company member based on metadata');
        setIsCompanyMember(true);
      } else if (userType === 'customer') {
        console.log('Setting as customer based on metadata');
        setIsCompanyMember(false);
      } else {
        // Fallback to email-based detection for existing users
        const email = user.email?.toLowerCase() || '';
        const companyDomains = ['iter8.com', 'company.com', 'admin.com'];
        const companyEmails = ['admin@iter8.com', 'founder@iter8.com', 'test@company.com'];
        const isTestCompany = email.includes('company') || email.includes('admin');
        
        const isCompanyDomain = companyDomains.some(domain => email.includes(domain));
        const isCompanyEmail = companyEmails.includes(email);
        
        const fallbackResult = isCompanyDomain || isCompanyEmail || isTestCompany;
        console.log('Using fallback detection:', { email, isTestCompany, isCompanyDomain, isCompanyEmail, fallbackResult });
        setIsCompanyMember(fallbackResult);
      }
      
      setLoading(false);
    };

    checkUserRole();
  }, [user]);

  return { isCompanyMember, loading };
}; 