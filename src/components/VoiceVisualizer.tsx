import React from 'react';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
  isActive: boolean;
}

const VoiceVisualizer = ({ isActive }: VoiceVisualizerProps) => {
  return (
    <div className="relative h-32 w-full flex items-center justify-center overflow-hidden">
      {/* Siri/Gemini-like glowing orb effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isActive && (
          <>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute w-32 h-32 bg-blue-500/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              className="absolute w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"
            />
          </>
        )}
      </div>

      {/* Waveform bars */}
      <div className="flex items-center justify-center gap-1.5 z-10 h-16">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={isActive ? {
              height: [10, 40 + Math.random() * 30, 10], // Random heights
              backgroundColor: ["#3b82f6", "#8b5cf6", "#3b82f6"] // Color shift
            } : {
              height: 4,
              backgroundColor: "#94a3b8"
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.1
            }}
            className="w-2 rounded-full bg-slate-400"
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceVisualizer;
