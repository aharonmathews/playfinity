import { useState } from "react";

type GameProps = { topic: string; onGameComplete: () => void };

type Question = {
  question: string;
  options: string[];
  answer: number;
};

const topicQuestions: Record<string, Question[]> = {
  Mathematics: [
    {
      question: "What is the value of π (pi) rounded to two decimal places?",
      options: ["3.14", "2.72", "1.62", "4.20"],
      answer: 0,
    },
    {
      question: "Which shape has three sides?",
      options: ["Square", "Triangle", "Circle", "Rectangle"],
      answer: 1,
    },
    {
      question: "What is 7 x 8?",
      options: ["54", "56", "64", "58"],
      answer: 1,
    },
    {
      question: "Which is a prime number?",
      options: ["4", "6", "7", "8"],
      answer: 2,
    },
    {
      question: "What is the square root of 81?",
      options: ["9", "8", "7", "6"],
      answer: 0,
    },
  ],
  Science: [
    {
      question: "What planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      answer: 1,
    },
    {
      question: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
      answer: 1,
    },
    {
      question: "What is H2O commonly known as?",
      options: ["Salt", "Water", "Sugar", "Oxygen"],
      answer: 1,
    },
    {
      question: "Which organ pumps blood through the body?",
      options: ["Liver", "Heart", "Lung", "Brain"],
      answer: 1,
    },
    {
      question: "What is the process by which plants make food?",
      options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
      answer: 1,
    },
  ],
  History: [
    {
      question: "Who was the first President of the United States?",
      options: [
        "Abraham Lincoln",
        "George Washington",
        "John Adams",
        "Thomas Jefferson",
      ],
      answer: 1,
    },
    {
      question: "In which year did World War II end?",
      options: ["1945", "1939", "1918", "1950"],
      answer: 0,
    },
    {
      question: "Who discovered America?",
      options: [
        "Christopher Columbus",
        "Marco Polo",
        "Vasco da Gama",
        "James Cook",
      ],
      answer: 0,
    },
    {
      question: "Which ancient civilization built the pyramids?",
      options: ["Greek", "Roman", "Egyptian", "Chinese"],
      answer: 2,
    },
    {
      question: "Who was known as the Maid of Orléans?",
      options: ["Cleopatra", "Joan of Arc", "Queen Victoria", "Elizabeth I"],
      answer: 1,
    },
  ],
  Geography: [
    {
      question: "Which is the largest continent?",
      options: ["Africa", "Asia", "Europe", "Australia"],
      answer: 1,
    },
    {
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      answer: 2,
    },
    {
      question: "Which ocean is the deepest?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      answer: 3,
    },
    {
      question: "Mount Everest is located in which mountain range?",
      options: ["Andes", "Rockies", "Himalayas", "Alps"],
      answer: 2,
    },
    {
      question: "Which country has the most population?",
      options: ["India", "USA", "China", "Brazil"],
      answer: 2,
    },
  ],
  Arts: [
    {
      question: "Who painted the Mona Lisa?",
      options: [
        "Vincent van Gogh",
        "Leonardo da Vinci",
        "Pablo Picasso",
        "Claude Monet",
      ],
      answer: 1,
    },
    {
      question: "Which instrument has keys, pedals, and strings?",
      options: ["Guitar", "Piano", "Violin", "Drum"],
      answer: 1,
    },
    {
      question: "Who wrote Romeo and Juliet?",
      options: [
        "Charles Dickens",
        "William Shakespeare",
        "Mark Twain",
        "Jane Austen",
      ],
      answer: 1,
    },
    {
      question: "Which art movement is Salvador Dalí associated with?",
      options: ["Surrealism", "Impressionism", "Cubism", "Baroque"],
      answer: 0,
    },
    {
      question: "What is the primary color?",
      options: ["Green", "Red", "Purple", "Orange"],
      answer: 1,
    },
  ],
};

export function GeneralKnowledgeGame({ topic, onGameComplete }: GameProps) {
  const questions = topicQuestions[topic] || [];
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  function handleSelect(idx: number) {
    setSelected(idx);
    if (questions[current] && idx === questions[current].answer) {
      setTimeout(() => {
        setScore((s) => s + 1);
        if (current < questions.length - 1) {
          setCurrent((c) => c + 1);
          setSelected(null);
        } else {
          setShowResult(true);
        }
      }, 600); // short delay for feedback
    }
    // If incorrect, keep selected and allow retry
  }

  function handleNext() {
    if (selected === questions[current].answer) {
      setScore((s) => s + 1);
    }
    setSelected(null);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setShowResult(true);
    }
  }

  function navigateHome() {
    window.location.href = "/";
  }

  if (questions.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No questions available for this topic.
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={navigateHome}
            className="rounded bg-indigo-600 text-white px-4 py-2 shadow-lg hover:bg-indigo-700"
          >
            Home
          </button>
        </div>
        <h2 className="text-2xl font-bold mb-6">Quiz Completed!</h2>
        <div className="text-lg mb-4">
          Your Score: {score} / {questions.length}
        </div>
        <button
          onClick={onGameComplete}
          className="rounded bg-green-600 text-white px-6 py-2 font-semibold hover:bg-green-700"
        >
          Finish
        </button>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={navigateHome}
          className="rounded bg-indigo-600 text-white px-4 py-2 shadow-lg hover:bg-indigo-700"
        >
          Home
        </button>
      </div>
      <div className="flex items-center justify-center gap-10 mb-2">
        <div className="text-sm text-gray-500">
          Question {current + 1} of {questions.length}
        </div>
        <div className="text-sm font-medium">Score: {score}</div>
      </div>
      {q ? (
        <>
          <h3 className="text-xl font-semibold mb-6 text-center max-w-xl">
            {q.question}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 justify-center mt-4">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`rounded-lg border px-6 py-6 text-lg font-semibold hover:bg-gray-50 transition-colors ${
                  selected === idx
                    ? idx === q.answer
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200"
                }`}
                disabled={selected === idx && idx === q.answer}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {/* Next button removed, navigation happens automatically after selecting an option */}
    </div>
  );
}
