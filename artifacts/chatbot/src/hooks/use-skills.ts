import { useCallback } from "react";

export interface SkillResult {
  type: "image" | "text" | "ascii" | "quiz" | "none";
  content: string;
  imageUrl?: string;
  quizData?: QuizQuestion;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "I asked my AI assistant for a joke. It said: 'undefined is not a function.' Classic.",
  "How many programmers does it take to change a light bulb? None — that's a hardware problem.",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
  "Why did the robot go on a diet? It had too many bytes! 🤖",
  "What's a robot's favorite music? Heavy metal! 🤘",
  "Why do robots never get lost? They always follow their algorithms! 🗺️",
  "What did the AI say to the toaster? 'You're not so smart either.'",
  "I tried to write a joke about neural networks. It kept hallucinating the punchline.",
  "Why did the developer go broke? Because they used up all their cache! 💸",
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "What does CPU stand for?",
    options: ["Central Processing Unit", "Computer Power Unit", "Core Processing Utility", "Coded Program Updater"],
    answer: 0,
  },
  {
    question: "Which programming language is known as the 'language of the web'?",
    options: ["Python", "Java", "JavaScript", "Ruby"],
    answer: 2,
  },
  {
    question: "What is the binary representation of the decimal number 10?",
    options: ["1010", "1001", "1100", "0110"],
    answer: 0,
  },
  {
    question: "Who is considered the father of the computer?",
    options: ["Alan Turing", "Charles Babbage", "John von Neumann", "Bill Gates"],
    answer: 1,
  },
  {
    question: "What does HTTP stand for?",
    options: ["HyperText Transfer Protocol", "High Transfer Text Process", "Hyper Terminal Transfer Program", "Home Transmission Transfer Protocol"],
    answer: 0,
  },
  {
    question: "What year was the first iPhone released?",
    options: ["2005", "2006", "2007", "2008"],
    answer: 2,
  },
  {
    question: "Which AI model family is made by OpenAI?",
    options: ["Gemini", "Claude", "GPT", "LLaMA"],
    answer: 2,
  },
];

const ASCII_TEMPLATES: Record<string, string> = {
  robot: `
    ╔═══════╗
    ║ ◉ ◉ ║  ← Beep boop!
    ║  ▽  ║
    ╚══╤══╝
    ┌──┴──┐
    │ AI  │
    └─────┘
   /       \\
  /  NOVA   \\`,
  heart: `
    ❤️  LOVE ❤️
   ♥♥♥   ♥♥♥
  ♥♥♥♥♥ ♥♥♥♥♥
   ♥♥♥♥♥♥♥♥♥
    ♥♥♥♥♥♥♥
     ♥♥♥♥♥
      ♥♥♥
       ♥`,
  star: `
       ★
      ★★★
   ★★★★★★★
      ★★★
   ★★★★★★★
      ★★★
       ★`,
  wave: `
  ∿∿∿∿∿∿∿∿∿∿
  ≈≈≈≈≈≈≈≈≈≈
  ~~~~~~~~~~~
  ≈≈≈≈≈≈≈≈≈≈
  ∿∿∿∿∿∿∿∿∿∿`,
  cat: `
   /\\_/\\
  ( o.o )
  > ^ <
   |   |
  (_)_(_)  Meow! 🐱`,
};

function buildImageUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt.trim());
  return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=512&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useSkills() {
  const processSkill = useCallback((message: string): SkillResult => {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith("/image ") || lower.startsWith("/img ")) {
      const prefix = lower.startsWith("/image ") ? "/image " : "/img ";
      const prompt = trimmed.slice(prefix.length).trim();
      if (!prompt) {
        return {
          type: "text",
          content: "**Image Generation** 🎨\n\nPlease provide a description after `/image`. For example:\n`/image a futuristic robot city at sunset`",
        };
      }
      return {
        type: "image",
        content: `Generating image for: **"${prompt}"**`,
        imageUrl: buildImageUrl(prompt),
      };
    }

    if (lower === "/joke" || lower === "/joke me" || lower === "tell me a joke") {
      return {
        type: "text",
        content: `😄 **Here's one for you:**\n\n${randomItem(JOKES)}`,
      };
    }

    if (lower === "/quiz" || lower === "/trivia") {
      const q = randomItem(QUIZ_QUESTIONS);
      return {
        type: "quiz",
        content: "",
        quizData: q,
      };
    }

    if (lower.startsWith("/ascii ") || lower.startsWith("/ascii")) {
      const key = trimmed.slice(6).trim().toLowerCase();
      if (ASCII_TEMPLATES[key]) {
        return {
          type: "ascii",
          content: "```\n" + ASCII_TEMPLATES[key] + "\n```",
        };
      }
      const keys = Object.keys(ASCII_TEMPLATES).join(", ");
      return {
        type: "text",
        content: `**ASCII Art** 🎨\n\nAvailable styles: \`${keys}\`\n\nUsage: \`/ascii robot\``,
      };
    }

    if (lower === "/meme" || lower.startsWith("/meme ")) {
      const topic = trimmed.slice(5).trim() || "coding";
      const memes = [
        `**TOP TEXT:** One does not simply\n**BOTTOM TEXT:** Write bug-free ${topic} on the first try`,
        `**TOP TEXT:** They said ${topic} would be easy\n**BOTTOM TEXT:** They lied`,
        `**TOP TEXT:** Me before learning ${topic}:\n**BOTTOM TEXT:** Me after learning ${topic}: *still confused*`,
        `**TOP TEXT:** When the ${topic} finally works\n**BOTTOM TEXT:** But you have no idea why`,
      ];
      return {
        type: "text",
        content: `🎭 **Meme Generator**\n\n${randomItem(memes)}`,
      };
    }

    if (lower === "/help" || lower === "/skills" || lower === "/commands") {
      return {
        type: "text",
        content: `🤖 **Nova AI Skills**\n\nHere are all the special commands you can use:\n\n| Command | Description |\n|---------|-------------|\n| \`/image [prompt]\` | Generate an AI image |\n| \`/joke\` | Get a random joke |\n| \`/quiz\` | Start a trivia quiz |\n| \`/ascii [style]\` | Generate ASCII art (robot, heart, star, wave, cat) |\n| \`/meme [topic]\` | Generate a meme |\n| \`/help\` | Show this menu |\n\nOr just **chat normally** — I answer all questions! 💬`,
      };
    }

    return { type: "none", content: "" };
  }, []);

  return { processSkill };
}
