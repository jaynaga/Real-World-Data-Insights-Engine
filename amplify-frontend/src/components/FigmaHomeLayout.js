import React from "react";
import '../styles/tokens.css';

// Example: Navigation items data
const navItems = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Upload", href: "/upload", icon: "⬆️" },
  { label: "Catalog", href: "/catalog", icon: "📚" },
  { label: "About", href: "/about", icon: "ℹ️" },
];

// Example: Feature cards data
const features = [
  {
    title: "Upload Data",
    description: "Easily upload your datasets for analysis.",
    icon: "⬆️",
    href: "/upload",
  },
  {
    title: "View Dashboard",
    description: "Visualize and monitor your data insights.",
    icon: "📊",
    href: "/dashboard",
  },
  {
    title: "Data Catalog",
    description: "Browse and manage your datasets.",
    icon: "📚",
    href: "/catalog",
  },
];

// Reusable NavItem component
function NavItem({ label, href, icon }) {
  return (
    <a
      href={href}
      className="flex items-center px-4 py-2 text-textPrimary-light dark:text-textPrimary-dark hover:bg-card-light dark:hover:bg-card-dark rounded transition"
    >
      <span className="mr-2">{icon}</span>
      {label}
    </a>
  );
}

// Reusable FeatureCard component
function FeatureCard({ title, description, icon, href }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center card hover:shadow-lg transition w-full md:w-1/3 m-2"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-textPrimary-light dark:text-textPrimary-dark">{title}</h3>
      <p className="text-subtle text-center">{description}</p>
    </a>
  );
}

// Main layout component
export default function FigmaHomeLayout() {
  return (
    <div className="min-h-screen page-bg flex flex-col">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-4 card shadow">
        <div className="text-2xl font-bold text-accent-light dark:text-accent-dark">RWDE</div>
        <div className="flex space-x-2">
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>
        <div>
          <button className="btn-accent">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center flex-1 py-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-4 text-center">
          Welcome to the Responsible Web Data Explorer
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 text-center max-w-2xl">
          Discover, analyze, and visualize web datasets with a focus on fairness and transparency.
        </p>
        <div className="flex flex-col md:flex-row justify-center w-full max-w-4xl">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </header>

      {/* Footer */}
      <footer className="bg-white shadow-inner py-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Responsible Web Data Explorer. All rights reserved.
      </footer>
    </div>
  );
}
