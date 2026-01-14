import { useEffect, useState } from "react";

const steps = [
  "Interpreting your idea",
  "Planning system architecture",
  "Generating intelligent components",
  "Applying design intelligence",
  "Finalizing and optimizing output",
];

const STEP_DURATION = 4200;

const AINeuralLoader = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, STEP_DURATION);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-950 text-white overflow-hidden">

      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-fuchsia-500/15 blur-3xl animate-pulse" />

      {/* Neural core */}
      <div className="relative w-48 h-48 mb-10">
        
        {/* Outer orbit */}
        <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-spin-slow" />
        
        {/* Middle orbit */}
        <div className="absolute inset-6 rounded-full border border-purple-500/30 animate-spin-reverse-slow" />
        
        {/* Inner orbit */}
        <div className="absolute inset-12 rounded-full border border-fuchsia-500/30 animate-spin-slow" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute w-2 h-2 bg-indigo-400 rounded-full animate-pulse"
            style={{
              top: `${20 + i * 10}%`,
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 400}ms`,
            }}
          />
        ))}

        {/* Core */}
        <div className="absolute inset-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse shadow-2xl shadow-indigo-500/50" />
      </div>

      {/* AI thinking text */}
      <p
        key={step}
        className="text-lg font-medium tracking-wide text-white/90 transition-all duration-700 ease-out"
      >
        {steps[step]}
      </p>

      {/* Typing dots */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>

      {/* Sub text */}
      <p className="mt-6 text-xs text-gray-400 text-center max-w-xs">
        AI is actively reasoning and constructing your experience
      </p>
    </div>
  );
};

export default AINeuralLoader;
