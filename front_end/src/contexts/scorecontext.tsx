import React, { createContext, useContext, useState, ReactNode } from "react";

interface ScoreContextType {
  score: number;
  addPoints: (points: number) => void;
  resetScore: () => void;
  getScore: () => number;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export function ScoreProvider({ children }: { children: ReactNode }) {
  const [score, setScore] = useState(0);

  const addPoints = (points: number) => {
    setScore((prevScore) => prevScore + points);
  };

  const resetScore = () => {
    setScore(0);
  };

  const getScore = () => score;

  return (
    <ScoreContext.Provider value={{ score, addPoints, resetScore, getScore }}>
      {children}
    </ScoreContext.Provider>
  );
}

export function useScore() {
  const context = useContext(ScoreContext);
  if (!context) {
    throw new Error("useScore must be used within a ScoreProvider");
  }
  return context;
}
