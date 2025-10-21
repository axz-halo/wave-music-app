'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Music, Share2, Heart, MessageCircle, Play } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'WAVE에 오신 것을 환영합니다! 🎉',
      description: '음악으로 연결되는 새로운 세상에 함께해주세요',
      icon: Music,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-sk4-orange to-sk4-orange-light rounded-full flex items-center justify-center mx-auto">
            <Music className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-sk4-charcoal">음악을 공유하고 발견하세요</h3>
            <p className="text-sk4-dark-gray">친구들과 좋아하는 음악을 공유하고, 새로운 음악을 발견해보세요.</p>
          </div>
        </div>
      )
    },
    {
      id: 'waves',
      title: '웨이브 만들기 📱',
      description: 'YouTube에서 좋아하는 음악을 찾아 웨이브로 공유해보세요',
      icon: Share2,
      content: (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-sk4-gray shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <img 
                src="https://img.youtube.com/vi/gdZLi9oWNZg/mqdefault.jpg" 
                alt="음악 썸네일"
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-sk4-charcoal">Dynamite</p>
                <p className="text-xs text-sk4-dark-gray">BTS</p>
              </div>
              <button className="p-2 bg-sk4-orange text-white rounded-full">
                <Play className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-sk4-dark-gray">"아침에 듣기 좋은 에너지 넘치는 곡! 🔥"</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-1 text-sk4-medium-gray">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">24</span>
                </button>
                <button className="flex items-center space-x-1 text-sk4-medium-gray">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">8</span>
                </button>
                <button className="flex items-center space-x-1 text-sk4-medium-gray">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs">3</span>
                </button>
              </div>
              <span className="text-lg">🔥</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-sk4-dark-gray">
              <strong>1단계:</strong> YouTube에서 음악 링크 복사<br/>
              <strong>2단계:</strong> 웨이브 만들기 버튼 클릭<br/>
              <strong>3단계:</strong> 감상과 함께 공유
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'interactions',
      title: '상호작용하기 💬',
      description: '좋아요, 댓글, 공유로 음악에 대한 의견을 나눠보세요',
      icon: Heart,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-sk4-orange/10 rounded-lg">
              <Heart className="w-6 h-6 text-sk4-orange mx-auto mb-2" />
              <p className="text-xs font-medium text-sk4-charcoal">좋아요</p>
              <p className="text-xs text-sk4-dark-gray">마음에 드는 웨이브에</p>
            </div>
            <div className="text-center p-3 bg-sk4-orange/10 rounded-lg">
              <MessageCircle className="w-6 h-6 text-sk4-orange mx-auto mb-2" />
              <p className="text-xs font-medium text-sk4-charcoal">댓글</p>
              <p className="text-xs text-sk4-dark-gray">의견을 남겨보세요</p>
            </div>
            <div className="text-center p-3 bg-sk4-orange/10 rounded-lg">
              <Share2 className="w-6 h-6 text-sk4-orange mx-auto mb-2" />
              <p className="text-xs font-medium text-sk4-charcoal">공유</p>
              <p className="text-xs text-sk4-dark-gray">다른 사람에게 전달</p>
            </div>
          </div>
          <div className="bg-sk4-light-gray/50 rounded-lg p-3">
            <p className="text-sm text-sk4-dark-gray text-center">
              💡 <strong>팁:</strong> 댓글로 음악에 대한 이야기를 나누면 더 재미있어요!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'stations',
      title: '스테이션 탐색하기 📻',
      description: 'YouTube 플레이리스트를 가져와서 친구들과 공유해보세요',
      icon: Music,
      content: (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-sk4-gray shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-sk4-orange to-sk4-orange-light rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-sk4-charcoal">90년대 힙합 모음</p>
                <p className="text-xs text-sk4-dark-gray">23곡 • 김음악님</p>
              </div>
            </div>
            <p className="text-xs text-sk4-dark-gray mb-3">90년대 힙합의 명곡들을 모았습니다. 추억에 젖어보세요.</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-1 text-sk4-medium-gray">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">45</span>
                </button>
                <button className="flex items-center space-x-1 text-sk4-medium-gray">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">12</span>
                </button>
              </div>
              <span className="text-xs bg-sk4-orange text-white px-2 py-1 rounded">공유됨</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-sk4-dark-gray">
              <strong>스테이션 기능:</strong><br/>
              • YouTube 플레이리스트 가져오기<br/>
              • 개별 곡을 웨이브로 만들기<br/>
              • 스테이션 전체를 피드에 공유
            </p>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sk4-gray">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sk4-orange to-sk4-orange-light rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-sk4-charcoal">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-sk4-light-gray rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-sk4-medium-gray" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-sk4-light-gray">
          <div 
            className="h-full bg-gradient-to-r from-sk4-orange to-sk4-orange-light transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-sk4-charcoal mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-sk4-dark-gray">
              {currentStepData.description}
            </p>
          </div>

          <div className="min-h-[300px] flex items-center justify-center">
            {currentStepData.content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-sk4-gray">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-sk4-medium-gray hover:text-sk4-charcoal disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">이전</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-2 bg-sk4-orange text-white rounded-lg hover:bg-sk4-orange-dark transition-colors"
          >
            <span className="text-sm font-medium">
              {currentStep === steps.length - 1 ? '시작하기' : '다음'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}



