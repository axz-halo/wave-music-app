'use client';

import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'wave_onboarding_completed';

export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // 온보딩 완료 상태 확인
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setIsCompleted(!!completed);
    
    // 완료되지 않은 경우 튜토리얼 표시
    if (!completed) {
      setShowTutorial(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsCompleted(true);
    setShowTutorial(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setIsCompleted(false);
    setShowTutorial(true);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  return {
    isCompleted,
    showTutorial,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
  };
}



