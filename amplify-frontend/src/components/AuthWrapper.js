import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

function AuthWrapper({ children }) {
  return (
    <Authenticator loginMechanisms={["email"]}>
      {({ signOut, user }) => (
        <>
          {/* Optionally show user info or sign out button */}
          {children}
        </>
      )}
    </Authenticator>
  );
}

export default AuthWrapper;
