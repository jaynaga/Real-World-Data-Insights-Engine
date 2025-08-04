import React, { createContext, useContext, useState, useEffect } from 'react';

const TutorialContext = createContext();

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    // Check if user has seen the tutorial before
    const tutorialSeen = localStorage.getItem('rwde_tutorial_seen');
    const hasSeenBefore = tutorialSeen === 'true';
    setHasSeenTutorial(hasSeenBefore);

    // Show tutorial for new users (who haven't seen it)
    if (!hasSeenBefore) {
      setShowWelcomeTutorial(true);
    }
  }, []);

  const markTutorialAsSeen = () => {
    localStorage.setItem('rwde_tutorial_seen', 'true');
    setHasSeenTutorial(true);
    setShowWelcomeTutorial(false);
  };

  const showTutorial = () => {
    setShowWelcomeTutorial(true);
  };

  const hideTutorial = () => {
    setShowWelcomeTutorial(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem('rwde_tutorial_seen');
    setHasSeenTutorial(false);
    setShowWelcomeTutorial(true);
  };

  const value = {
    showWelcomeTutorial,
    hasSeenTutorial,
    showTutorial,
    hideTutorial,
    markTutorialAsSeen,
    resetTutorial
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
