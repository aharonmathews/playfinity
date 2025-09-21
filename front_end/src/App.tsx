import { useMemo, useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { GamePage } from "./pages/GamePage";
import { SingleGamePage } from "./pages/SingleGamePage";
import { CustomGamePage } from "./pages/CustomGamePage";
import { TestCustomGamePage } from "./pages/TestCustomGamePage"; // ✅ Test version
import { ScoreProvider } from "./contexts/ScoreContext";
import confetti from "canvas-confetti";

const applauseSound = new Audio(
  "https://www.soundjay.com/human/applause-8.mp3"
);
applauseSound.volume = 0.7;
applauseSound.load();

export const celebrate = () => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#FFD700", "#FF6347", "#00FFFF", "#FF69B4"],
  });
  applauseSound.play().catch(() => {});
};

export type Topic = { id: string; title: string };
export type UserProfile = { name: string; age: number; disability: string };

export const topics: Topic[] = [
  { id: "t1", title: "Mathematics" },
  { id: "t2", title: "Science" },
  { id: "t3", title: "History" },
  { id: "t4", title: "Geography" },
  { id: "t5", title: "Arts" },
];
export function App() {
  return (
    <ScoreProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:topicId" element={<GamePage />} />

          {/* ✅ Make sure this route exists */}
          <Route path="/custom-games" element={<CustomGamePage />} />

          {/* ✅ Test version (no API calls) */}
          <Route path="/test-games" element={<TestCustomGamePage />} />

          <Route
            path="/game/:topicId/spelling"
            element={<SingleGamePage gameType="spelling" />}
          />
          <Route
            path="/game/:topicId/drawing"
            element={<SingleGamePage gameType="drawing" />}
          />
          <Route
            path="/game/:topicId/gallery"
            element={<SingleGamePage gameType="gallery" />}
          />
          <Route
            path="/game/:topicId/gk"
            element={<SingleGamePage gameType="gk" />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ScoreProvider>
  );
}
