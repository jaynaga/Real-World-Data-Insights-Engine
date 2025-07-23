import React from 'react';

function Footer() {
  return (
    <footer className="page-bg text-center mt-4 py-4">
      <span className="text-subtle text-sm">
        &copy; {new Date().getFullYear()} Data Commons. All rights reserved.
      </span>
    </footer>
  );
}

export default Footer;
