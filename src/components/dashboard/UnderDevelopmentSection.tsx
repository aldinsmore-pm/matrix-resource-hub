
import React from "react";

interface UnderDevelopmentSectionProps {
  sectionName: string;
  animationComplete: boolean;
}

const UnderDevelopmentSection = ({ sectionName, animationComplete }: UnderDevelopmentSectionProps) => {
  return (
    <div className={`min-h-[400px] flex items-center justify-center transition-all duration-500
        ${animationComplete ? 'opacity-100' : 'opacity-0 translate-y-5'}`}>
      <div 
        className="text-center p-8 card-container rounded-lg border border-matrix-border/50 backdrop-blur-sm bg-matrix-bg-alt/30" 
        style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.05)' }}
      >
        <h3 className="text-xl font-bold mb-2 pipboy-text">
          {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
        </h3>
        <p className="text-gray-400 pipboy-text">This section is under development.</p>
      </div>
    </div>
  );
};

export default UnderDevelopmentSection;
