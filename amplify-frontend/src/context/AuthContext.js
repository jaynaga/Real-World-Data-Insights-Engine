import React, { createContext, useContext, useState, useEffect } from "react";
import { Auth } from 'aws-amplify';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const userData = await Auth.currentAuthenticatedUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
    setLoading(false);
  }

  async function signUp(email, password) {
    try {
      await Auth.signUp({
        username: email,
        password,
        attributes: {
          email
        }
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async function confirmSignUp(email, code) {
    try {
      await Auth.confirmSignUp(email, code);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async function login(email, password) {
    try {
      console.log('Attempting login for:', email);
      const userData = await Auth.signIn(email, password);
      console.log('Login successful, user data:', userData);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'UserNotConfirmedException') {
        // User exists but hasn't confirmed their email
        return { success: false, message: 'Please check your email and verify your account first.' };
      } else if (error.code === 'NotAuthorizedException') {
        // Incorrect password
        return { success: false, message: 'Incorrect username or password.' };
      } else if (error.code === 'UserNotFoundException') {
        // User doesn't exist
        return { success: false, message: 'No account found with this email.' };
      }
      return { success: false, message: error.message };
    }
  }

  async function logout() {
    try {
      await Auth.signOut();
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  const value = {
    user,
    loading,
    signUp,
    confirmSignUp,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
