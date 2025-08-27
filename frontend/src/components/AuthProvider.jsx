import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../api.js';

const AuthProvider = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set up the auth token getter for API calls
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
};

export default AuthProvider;
