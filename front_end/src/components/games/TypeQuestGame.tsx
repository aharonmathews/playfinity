import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

// --- Sound setup ---
const victorySound = typeof window !== 'undefined' ? new (window as any).Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_2b22b62174.mp3") : null;
if (victorySound) { victorySound.volume = 0.6; victorySound.load(); }

const wrongSound = typeof window !== 'undefined' ? new (window as any).Audio("https://cdn.pixabay.com/audio/2021/08/04/audio_c6ccf348d8.mp3") : null;
if (wrongSound) { wrongSound.volume = 0.5; wrongSound.load(); }

const playerAttackSound = typeof window !== 'undefined' ? new (window as any).Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_13b532986a.mp3") : null;
if (playerAttackSound) { playerAttackSound.volume = 0.7; playerAttackSound.load(); }

const monsterAttackSound = typeof window !== 'undefined' ? new (window as any).Audio("https://cdn.pixabay.com/audio/2022/08/17/audio_34ba9956a8.mp3") : null;
if (monsterAttackSound) { monsterAttackSound.volume = 0.6; monsterAttackSound.load(); }

// --- Game constants ---
const PLAYER_MAX_HEALTH = 100;
const MONSTER_MAX_HEALTH = 100;
const PLAYER_ATTACK_POWER = 25;
const MONSTER_ATTACK_POWER = 20;
const QUESTION_TIME = 15; // Increased time for harder questions

const monsters = [
    { name: 'Goblin Grunt', emoji: '👹', color: 'green', attackType: 'rock' },
    { name: 'Slime Blob', emoji: '🦠', color: 'teal', attackType: 'goo' },
    { name: 'Spooky Ghost', emoji: '👻', color: 'indigo', attackType: 'scream' },
    { name: 'Fire Dragon', emoji: '🐲', color: 'red', attackType: 'fireball' },
];

interface GameProps {
  onGameComplete: () => void;
}

// --- Question Generation Engine ---
function generateQuestion(difficulty: string) {
    let questionTypes: string[] = [];

    if (difficulty === 'easy') {
        questionTypes = ['add', 'subtract', 'multiply_simple', 'divide_simple'];
    } else if (difficulty === 'medium') {
        questionTypes = ['multiply', 'divide', 'add_fraction_simple', 'add_decimal', 'geometry_sides'];
    } else { // Hard
        questionTypes = ['divide_remainder', 'multiply_fraction', 'percentage', 'algebra_simple', 'roman_numerals'];
    }

    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    let text: string;
    let answer: number | string;

    switch (type) {
        case 'add':
            const a = Math.floor(Math.random() * 20) + 1; 
            const b = Math.floor(Math.random() * 20) + 1;
            text = `${a} + ${b}`; 
            answer = a + b; 
            break;
        case 'subtract':
            const c = Math.floor(Math.random() * 20) + 1; 
            const d = Math.floor(Math.random() * 20) + 1;
            text = `${Math.max(c, d)} - ${Math.min(c, d)}`; 
            answer = Math.max(c, d) - Math.min(c, d); 
            break;
        case 'multiply_simple':
            const e = Math.floor(Math.random() * 10) + 1; 
            const f = Math.floor(Math.random() * 10) + 1;
            text = `${e} × ${f}`; 
            answer = e * f; 
            break;
        case 'divide_simple':
            const g = Math.floor(Math.random() * 10) + 2; 
            const resH = Math.floor(Math.random() * 10) + 2;
            text = `${g * resH} ÷ ${g}`; 
            answer = resH; 
            break;
        case 'multiply':
            const i = Math.floor(Math.random() * 15) + 5; 
            const j = Math.floor(Math.random() * 15) + 5;
            text = `${i} × ${j}`; 
            answer = i * j; 
            break;
        case 'divide_remainder':
            const k = Math.floor(Math.random() * 50) + 20; 
            const l = Math.floor(Math.random() * 10) + 3;
            text = `${k} ÷ ${l} (remainder?)`; 
            answer = k % l; 
            break;
        case 'add_fraction_simple':
            const den = [4, 6, 8][Math.floor(Math.random()*3)]; 
            const num1 = Math.floor(Math.random() * (den-1)) + 1; 
            let num2: number; 
            do { 
                num2 = Math.floor(Math.random() * (den-1)) + 1; 
            } while (num1 + num2 >= den);
            text = `${num1}/${den} + ${num2}/${den} (answer as ?/${den})`; 
            answer = num1 + num2; 
            break;
        case 'add_decimal':
            const m = (Math.floor(Math.random()*50)+10)/10; 
            const n = (Math.floor(Math.random()*50)+10)/10;
            text = `${m} + ${n}`; 
            answer = parseFloat((m + n).toFixed(1)); 
            break;
        case 'geometry_sides':
            const shapes = [{n:'Triangle', s:3}, {n:'Square', s:4}, {n:'Pentagon',s:5}, {n:'Hexagon',s:6}]; 
            const shape = shapes[Math.floor(Math.random()*shapes.length)];
            text = `Sides on a ${shape.n}?`; 
            answer = shape.s; 
            break;
        case 'multiply_fraction':
            const num3 = Math.floor(Math.random()*5)+1; 
            const den3 = Math.floor(Math.random()*5)+2; 
            const num4 = Math.floor(Math.random()*5)+1;
            text = `1/${den3} × ${num3}/${num4}`; 
            answer = `${num3}/${den3*num4}`; 
            break;
        case 'percentage':
            const perc = [10, 20, 25, 50][Math.floor(Math.random()*4)]; 
            const of = [40, 60, 80, 100][Math.floor(Math.random()*4)];
            text = `${perc}% of ${of}?`; 
            answer = (perc / 100) * of; 
            break;
        case 'algebra_simple':
            const opType = ['add', 'subtract', 'multiply', 'divide'][Math.floor(Math.random() * 4)];
            const val1 = Math.floor(Math.random() * 10) + 2;
            const val2 = Math.floor(Math.random() * 10) + 2;
            switch (opType) {
                case 'add':
                    text = `x + ${val1} = ${val1 + val2}`;
                    answer = val2;
                    break;
                case 'subtract':
                    text = `x - ${val1} = ${val2}`;
                    answer = val1 + val2;
                    break;
                case 'multiply':
                    text = `${val1}x = ${val1 * val2}`;
                    answer = val2;
                    break;
                case 'divide':
                    text = `x ÷ ${val1} = ${val2}`;
                    answer = val1 * val2;
                    break;
                default:
                    text = `${val1} + ${val2}`;
                    answer = val1 + val2;
            }
            break;
        case 'roman_numerals':
            const romans = [{r:'V', n:5}, {r:'IX', n:9}, {r:'XII', n:12}, {r:'XX',n:20}]; 
            const rom = romans[Math.floor(Math.random()*romans.length)];
            text = `What is ${rom.r} in numbers?`; 
            answer = rom.n; 
            break;
        default:
            const r = Math.floor(Math.random() * 20) + 1; 
            const s = Math.floor(Math.random() * 20) + 1;
            text = `${r} + ${s}`; 
            answer = r + s; 
            break;
    }
    return { text, answer };
}

function celebrate() {
  confetti({ 
    particleCount: 200, 
    spread: 100, 
    origin: { y: 0.6 }, 
    colors: ["#22c55e", "#fde047", "#3b82f6", "#ec4899"] 
  });
  victorySound?.play().catch((e: any) => console.error("Error playing sound:", e));
}

// --- Sub-components ---
const HealthBar = ({ currentHealth, maxHealth }: { currentHealth: number; maxHealth: number }) => {
  const healthPercentage = (currentHealth / maxHealth) * 100;
  const barColor = healthPercentage > 50 ? 'bg-green-500' : healthPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full bg-slate-300 rounded-full h-6 border-2 border-slate-400">
      <div 
        className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`} 
        style={{ width: `${healthPercentage}%` }}
      ></div>
    </div>
  );
};

const TimerBar = ({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) => {
  const timePercentage = (timeLeft / maxTime) * 100;
  const barColor = timeLeft > maxTime * 0.5 ? 'bg-sky-400' : timeLeft > maxTime * 0.25 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="w-full max-w-sm mx-auto bg-slate-600 rounded-full h-4 mt-4 border-2 border-slate-500">
      <div 
        className={`h-full rounded-full ${barColor} transition-all duration-200 linear`} 
        style={{ width: `${timePercentage}%` }}
      ></div>
    </div>
  );
}

// --- ADHD-FRIENDLY Tutorial Component ---
const TutorialScreen = ({ onBack }: { onBack: () => void }) => {
    const topics = [
        { 
            title: "Fractions", 
            icon: "🍕",
            content: "Think of fractions as pieces of a pizza. The bottom number is how many slices in total, the top is how many you have.", 
            example: { type: 'text', value: "1/4 + 2/4 = 3/4" } 
        },
        { 
            title: "Decimals", 
            icon: "🔢",
            content: "Decimals are used for numbers that aren't whole. The most important rule is to line up the decimal points when you add or subtract.", 
            example: { type: 'decimal', values: ['2.5', '+ 1.5', '4.0'] } 
        },
        { 
            title: "Percentages", 
            icon: "%",
            content: "'Per cent' means 'out of 100'. So, 50% is the same as half of something.", 
            example: { type: 'percentage', value: 50, total: 10 } 
        },
        { 
            title: "Algebra", 
            icon: "⚖",
            content: "The letter 'x' is just a mystery box. To find 'x', do the opposite operation to the other side of the '='.", 
            example: { type: 'algebra_expanded' } 
        },
    ];

    const [activeTopic, setActiveTopic] = useState(topics[0]);

    const renderExample = (example: any) => {
        switch (example.type) {
            case 'decimal':
                return (
                    <div className="bg-slate-900 p-4 rounded-lg font-mono text-2xl text-left inline-block">
                        <p className="text-yellow-300">  {example.values[0]}</p>
                        <p className="text-yellow-300">{example.values[1]}</p>
                        <p className="border-t-2 border-slate-600 mt-1 pt-1 text-green-400">  {example.values[2]}</p>
                    </div>
                );
            case 'percentage':
                return (
                    <div className="flex flex-col items-center">
                        <p className="text-xl mb-2">{example.value}% of {example.total} is {example.total * (example.value/100)}</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {Array.from({ length: example.total }).map((_, i) => (
                                <div key={i} className={`w-6 h-6 rounded-full ${i < (example.total * (example.value/100)) ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                            ))}
                        </div>
                    </div>
                );
             case 'algebra_expanded':
                return (
                    <div className="grid grid-cols-2 gap-4 text-center w-full">
                        <div className="bg-slate-900/70 p-3 rounded flex flex-col justify-between">
                            <p className="font-bold text-lg text-sky-400">Addition Problem</p>
                            <p className="font-mono text-xl text-yellow-300">x + 5 = 15</p>
                            <p className="font-mono text-lg text-green-400">x = 10</p>
                        </div>
                         <div className="bg-slate-900/70 p-3 rounded flex flex-col justify-between">
                            <p className="font-bold text-lg text-sky-400">Subtraction Problem</p>
                            <p className="font-mono text-xl text-yellow-300">x - 5 = 10</p>
                            <p className="font-mono text-lg text-green-400">x = 15</p>
                        </div>
                         <div className="bg-slate-900/70 p-3 rounded flex flex-col justify-between">
                            <p className="font-bold text-lg text-sky-400">Multiplication Problem</p>
                            <p className="font-mono text-xl text-yellow-300">3x = 12</p>
                            <p className="font-mono text-lg text-green-400">x = 4</p>
                        </div>
                         <div className="bg-slate-900/70 p-3 rounded flex flex-col justify-between">
                            <p className="font-bold text-lg text-sky-400">Division Problem</p>
                            <p className="font-mono text-xl text-yellow-300">x ÷ 2 = 5</p>
                            <p className="font-mono text-lg text-green-400">x = 10</p>
                        </div>
                    </div>
                )
            default:
                return <p className="font-mono text-3xl text-yellow-300">{example.value}</p>
        }
    }

    return (
        <div className="flex flex-col items-center justify-between h-full animate-fade-in p-2 sm:p-4 w-full">
            <h1 className="text-5xl font-extrabold text-yellow-300">Wizard's Library</h1>
            
            <div className="flex justify-center gap-2 sm:gap-4 my-6 flex-wrap">
                {topics.map(topic => (
                    <button 
                        key={topic.title} 
                        onClick={() => setActiveTopic(topic)}
                        className={`px-4 py-2 rounded-lg font-bold transition-all text-lg flex items-center gap-2 ${activeTopic.title === topic.title ? 'bg-green-500 text-white scale-110' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
                    >
                        <span className="text-2xl">{topic.icon}</span>
                        {topic.title}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-2xl bg-slate-800 p-6 rounded-lg text-center flex-grow flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-green-400 mb-3">{activeTopic.title}</h2>
                <p className="text-slate-300 text-lg mb-6">{activeTopic.content}</p>
                <div className="bg-slate-900/50 p-6 rounded-xl flex items-center justify-center min-h-[120px]">
                    {renderExample(activeTopic.example)}
                </div>
            </div>

            <button 
              onClick={onBack} 
              className="mt-6 px-10 py-3 bg-blue-500 text-white font-bold text-xl rounded-lg hover:bg-blue-600 active:scale-95 transition-transform"
            >
              Back to Menu
            </button>
        </div>
    )
};

// --- Main Game Component ---
export default function TypeQuestGame({ onGameComplete }: GameProps) {
    const [question, setQuestion] = useState<{ text: string; answer: number | string } | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH);
    const [monsterHealth, setMonsterHealth] = useState(MONSTER_MAX_HEALTH);
    const [monster, setMonster] = useState(monsters[0]);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [difficulty, setDifficulty] = useState('easy');
    
    const [gameState, setGameState] = useState("menu"); // menu, tutorial, difficultySelect, playing, won, lost
    const [feedback, setFeedback] = useState("");
    const [isPlayerAttacking, setPlayerAttacking] = useState(false);
    const [isMonsterAttacking, setMonsterAttacking] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const isAttackingRef = useRef(false);

    useEffect(() => { 
      isAttackingRef.current = isPlayerAttacking || isMonsterAttacking; 
    }, [isPlayerAttacking, isMonsterAttacking]);

    useEffect(() => {
        if (gameState !== 'playing' || !question) return;
        if (timeLeft <= 0) { handleIncorrectAnswer(); return; }
        const timerId = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, gameState, question]);

    useEffect(() => {
        if (gameState === "playing" && inputRef.current) { 
          inputRef.current.focus(); 
        }
    }, [question, gameState]);
 
    const handleIncorrectAnswer = () => {
        if (isAttackingRef.current) return;
        wrongSound?.play().catch((e: any) => console.error("Error playing sound:", e));
        setFeedback("wrong");
        setMonsterAttacking(true);
        const newPlayerHealth = playerHealth - MONSTER_ATTACK_POWER;
        setTimeout(() => {
            monsterAttackSound?.play().catch((e: any) => console.error("Error playing sound:", e));
            setPlayerHealth(newPlayerHealth);
            setMonsterAttacking(false);
            if (newPlayerHealth <= 0) {
                setGameState("lost");
            } else {
                setQuestion(generateQuestion(difficulty));
                setTimeLeft(QUESTION_TIME);
            }
        }, 600);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (gameState !== "playing" || !inputValue || isAttackingRef.current || !question) return;
        
        // Handle fraction answers
        const isCorrect = typeof question.answer === 'string' && question.answer.includes('/') 
            ? inputValue === question.answer
            : parseFloat(inputValue) === question.answer;

        if (isCorrect) {
            setFeedback("correct");
            setPlayerAttacking(true);
            const newMonsterHealth = monsterHealth - PLAYER_ATTACK_POWER;
            setTimeout(() => {
                playerAttackSound?.play().catch((e: any) => console.error("Error playing sound:", e));
                setMonsterHealth(newMonsterHealth);
                setPlayerAttacking(false);
                if (newMonsterHealth <= 0) {
                    setGameState("won");
                    celebrate();
                } else {
                    setQuestion(generateQuestion(difficulty));
                    setTimeLeft(QUESTION_TIME);
                }
            }, 600);
        } else {
            handleIncorrectAnswer();
        }
        setInputValue("");
        setTimeout(() => setFeedback(""), 800);
    };

    const handleStartGame = (selectedDifficulty: string) => {
        setDifficulty(selectedDifficulty);
        setPlayerHealth(PLAYER_MAX_HEALTH);
        setMonsterHealth(MONSTER_MAX_HEALTH);
        const newMonster = monsters[Math.floor(Math.random() * monsters.length)];
        setMonster(newMonster);
        setQuestion(generateQuestion(selectedDifficulty));
        setTimeLeft(QUESTION_TIME);
        setInputValue("");
        setGameState("playing");
        setFeedback("");
    };

    const handleBackToMenu = () => {
        setGameState("menu");
        setPlayerHealth(PLAYER_MAX_HEALTH);
        setMonsterHealth(MONSTER_MAX_HEALTH);
    }
    
    const MonsterAttackAnimation = () => {
        if (!isMonsterAttacking) return null;
        switch(monster.attackType) {
            case 'fireball': return <div className="fireball-animation"></div>;
            case 'scream': return <div className="scream-animation"></div>;
            case 'rock': return <div className="rock-animation"></div>;
            case 'goo': return <div className="goo-animation"></div>;
            default: return null;
        }
    }

    return (
        <div className="bg-slate-800 min-h-screen flex flex-col items-center justify-center p-4 font-sans text-white">
            <div className="w-full max-w-4xl h-[650px] bg-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 text-center border-4 border-slate-600 relative overflow-hidden flex items-center justify-center">
                
                {gameState === 'menu' && (
                    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                        <span className="text-9xl mb-4">⚔</span>
                        <h1 className="text-6xl font-extrabold text-yellow-300 mb-4">TypeQuest</h1>
                        <p className="text-xl text-slate-400 mb-8 max-w-md">Solve problems, defeat monsters, and become a math hero!</p>
                        <button 
                          onClick={() => setGameState('difficultySelect')} 
                          className="px-10 py-4 mb-3 bg-green-500 text-white font-bold text-2xl rounded-lg hover:bg-green-600 active:scale-95 transition-transform"
                        >
                          Start Adventure
                        </button>
                        <button 
                          onClick={() => setGameState('tutorial')} 
                          className="px-10 py-3 bg-sky-500 text-white font-bold text-xl rounded-lg hover:bg-sky-600 active:scale-95 transition-transform mb-3"
                        >
                          Wizard's Library
                        </button>
                        <button 
                          onClick={onGameComplete} 
                          className="px-6 py-2 bg-gray-500 text-white font-bold text-lg rounded-lg hover:bg-gray-600 active:scale-95 transition-transform"
                        >
                          Back to Games
                        </button>
                    </div>
                )}

                {gameState === 'tutorial' && <TutorialScreen onBack={() => setGameState('menu')} />}

                {gameState === 'difficultySelect' && (
                     <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                        <h1 className="text-5xl font-extrabold text-yellow-300 mb-8">Choose Your Challenge</h1>
                        <div className="flex flex-col md:flex-row gap-6">
                            <button 
                              onClick={() => handleStartGame('easy')} 
                              className="px-10 py-4 bg-green-600 text-white font-bold text-2xl rounded-lg border-4 border-green-400 hover:bg-green-700 transition-all transform hover:scale-105"
                            >
                              <h2>Easy</h2>
                              <p className="text-sm font-normal">Basic Arithmetic</p>
                            </button>
                            <button 
                              onClick={() => handleStartGame('medium')} 
                              className="px-10 py-4 bg-yellow-600 text-white font-bold text-2xl rounded-lg border-4 border-yellow-400 hover:bg-yellow-700 transition-all transform hover:scale-105"
                            >
                              <h2>Medium</h2>
                              <p className="text-sm font-normal">Fractions & Decimals</p>
                            </button>
                            <button 
                              onClick={() => handleStartGame('hard')} 
                              className="px-10 py-4 bg-red-600 text-white font-bold text-2xl rounded-lg border-4 border-red-400 hover:bg-red-700 transition-all transform hover:scale-105"
                            >
                              <h2>Hard</h2>
                              <p className="text-sm font-normal">Algebra & Percentages</p>
                            </button>
                        </div>
                        <button 
                          onClick={() => setGameState('menu')} 
                          className="mt-8 text-slate-400 hover:underline"
                        >
                          Back to Menu
                        </button>
                     </div>
                )}
                
                {(gameState === 'playing' || gameState === 'won' || gameState === 'lost') && (
                    <div className="w-full h-full flex flex-col">
                        {gameState === 'playing' && (
                            <button 
                              onClick={handleBackToMenu} 
                              className="absolute top-4 left-6 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors z-30"
                            >
                              ← Menu
                            </button>
                        )}

                        <div className="relative grid grid-cols-2 gap-8 mb-8 items-center">
                            {/* Player */}
                            <div className={`flex flex-col items-center gap-4 transition-transform duration-300 ${isMonsterAttacking ? 'animate-impact' : ''}`}>
                                <span className="text-8xl">💂</span>
                                <div className="w-full px-4">
                                  <h2 className="text-2xl font-bold text-blue-400 mb-2">You</h2>
                                  <HealthBar currentHealth={playerHealth} maxHealth={PLAYER_MAX_HEALTH} />
                                  <p className="font-bold text-xl mt-1">{playerHealth} / {PLAYER_MAX_HEALTH}</p>
                                </div>
                            </div>
                            {/* Monster */}
                            <div className={`flex flex-col items-center gap-4 transition-transform duration-300 ${isPlayerAttacking ? 'animate-impact' : ''}`}>
                                <span className="text-8xl">{monster.emoji}</span>
                                <div className="w-full px-4">
                                  <h2 className={`text-2xl font-bold text-${monster.color}-400 mb-2`}>{monster.name}</h2>
                                  <HealthBar currentHealth={monsterHealth} maxHealth={MONSTER_MAX_HEALTH} />
                                  <p className="font-bold text-xl mt-1">{monsterHealth > 0 ? monsterHealth : 0} / {MONSTER_MAX_HEALTH}</p>
                                </div>
                            </div>
                            {isPlayerAttacking && <div className="sword-slash-animation"></div>}
                            <MonsterAttackAnimation />
                        </div>
                        
                        <div className="flex-grow flex flex-col items-center justify-center bg-slate-800 rounded-lg p-4">
                        {gameState === "playing" && question && (
                            <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
                                <div className={`transition-transform duration-300 ${feedback === 'correct' ? 'scale-110' : ''}`}>
                                    <p className="text-xl md:text-2xl font-semibold text-slate-400 mb-4">Cast your spell!</p>
                                    <div className="text-5xl md:text-6xl font-bold text-yellow-300 mb-5 tracking-wider h-20 flex items-center justify-center">
                                      {question.text} ?
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <input 
                                      ref={inputRef} 
                                      type={typeof question.answer === 'string' && question.answer.includes('/') ? 'text' : 'number'} 
                                      value={inputValue} 
                                      onChange={(e) => setInputValue(e.target.value)} 
                                      className="w-48 text-center text-2xl font-bold p-3 border-4 border-slate-500 rounded-lg focus:outline-none focus:border-blue-500 transition bg-slate-900 text-white" 
                                      autoFocus 
                                      required 
                                    />
                                    <button 
                                      type="submit" 
                                      className="px-8 py-3 bg-green-500 text-white font-bold text-xl rounded-lg hover:bg-green-600 active:scale-95 transition-transform disabled:bg-slate-500" 
                                      disabled={isPlayerAttacking || isMonsterAttacking}
                                    >
                                      Attack!
                                    </button>
                                </div>
                                <div className="mt-3">
                                    <p className={`font-mono text-2xl font-bold transition-colors duration-500 ${timeLeft > 7 ? 'text-sky-300' : timeLeft > 3 ? 'text-yellow-300' : 'text-red-400 animate-pulse'}`}>
                                      {timeLeft}
                                    </p>
                                    <TimerBar timeLeft={timeLeft} maxTime={QUESTION_TIME} />
                                </div>
                            </form>
                        )}

                        {gameState !== "playing" && (
                            <div className="flex flex-col items-center justify-center animate-fade-in">
                                <h2 className={`text-6xl font-extrabold mb-4 ${gameState === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                                  {gameState === 'won' ? "You Are Victorious!" : "Game Over!"}
                                </h2>
                                <div className="flex gap-4 mt-4">
                                    <button 
                                      onClick={() => setGameState('difficultySelect')} 
                                      className="px-8 py-3 bg-blue-500 text-white font-bold text-xl rounded-lg hover:bg-blue-600 active:scale-95 transition-transform"
                                    >
                                      Play Again
                                    </button>
                                    <button 
                                      onClick={handleBackToMenu} 
                                      className="px-8 py-3 bg-slate-600 text-white font-bold text-xl rounded-lg hover:bg-slate-500 active:scale-95 transition-transform"
                                    >
                                      Menu
                                    </button>
                                    <button 
                                      onClick={onGameComplete} 
                                      className="px-8 py-3 bg-green-600 text-white font-bold text-xl rounded-lg hover:bg-green-700 active:scale-95 transition-transform"
                                    >
                                      Back to Games
                                    </button>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                )}
                
                <style>{`
                    @keyframes fade-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                    .animate-fade-in { animation: fade-in 0.5s ease-out; }
                    @keyframes impact { 0% { transform: scale(1); } 50% { transform: scale(1.1) rotate(-5deg); } 100% { transform: scale(1); } }
                    .animate-impact { animation: impact 0.3s ease-out; }
                    /* Player Attack */
                    @keyframes slash-anim { 0% { left: 25%; opacity: 1; transform: scale(0.8) rotate(-45deg); } 100% { left: 70%; opacity: 0; transform: scale(1.5) rotate(15deg); } }
                    .sword-slash-animation { position: absolute; top: 40%; left: 25%; width: 80px; height: 80px; background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(192,192,192,0.6) 40%, rgba(255,255,255,0) 70%); border-radius: 50%; clip-path: polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%); animation: slash-anim 0.5s ease-in forwards; }
                    /* Monster Attacks */
                    @keyframes fly-left { 0% { left: 70%; opacity: 1; transform: scale(1); } 100% { left: 25%; opacity: 0; transform: scale(0.5); } }
                    .fireball-animation { position: absolute; top: 40%; left: 70%; width: 60px; height: 60px; background: radial-gradient(circle, rgba(255,255,0,1) 0%, rgba(255,150,0,1) 40%, rgba(255,0,0,0) 70%); border-radius: 50%; animation: fly-left 0.5s ease-in forwards; }
                    .rock-animation { position: absolute; top: 40%; left: 70%; width: 50px; height: 50px; background: radial-gradient(circle, #967969 0%, #634e42 70%); border-radius: 50%; animation: fly-left 0.5s ease-in forwards; transform: rotate(45deg); }
                    .goo-animation { position: absolute; top: 40%; left: 70%; width: 50px; height: 50px; background: radial-gradient(circle, #abff00 0%, #50c878 70%); border-radius: 70% 30% 60% 40% / 60% 40% 70% 30% ; animation: fly-left 0.5s ease-in forwards; }
                    .scream-animation { position: absolute; top: 40%; left: 70%; width: 60px; height: 60px; background-color: #a855f7; border-radius: 50%; box-shadow: 0 0 20px #a855f7, 0 0 30px #d8b4fe; opacity: 0.7; animation: fly-left 0.5s ease-out forwards; }
                `}</style>
            </div>
        </div>
    );
}