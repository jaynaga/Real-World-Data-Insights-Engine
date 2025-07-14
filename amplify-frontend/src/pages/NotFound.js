import React from 'react';


export default function NotFound() {
  return (
    <>

      <div className="min-h-screen h-screen flex flex-col items-center justify-center page-bg">
        <h1 className="text-4xl font-bold mb-4 text-red-600">404 - Page Not Found</h1>
        <p className="text-lg text-subtle mb-6">Sorry, the page you are looking for does not exist or something went wrong.</p>
        <a href="/" className="btn-accent">Go Home</a>
      </div>
    </>
  );
}
