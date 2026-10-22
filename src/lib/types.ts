export type AvatarId = 'alim' | 'raihan';

export type Word = {
  id: number;
  topic: string;
  ug: string;
  arabic: string | null;
  latin: string | null;
  ru: string;
  ruShort: string;
  pos: string | null;
  status: string;
  audio: string | null;
};

export type Section = { id: string; position: number; title: string; city: string };

export type Level = {
  id: string;
  sectionId: string;
  position: number;
  title: string;
  wordIds: number[];
};

export type Letter = { upper: string; arabic: string; exampleWordId: number | null; uyghur: boolean };

export type QuizQuestion = { question: string; options: string[]; answer: number };

export type Story = {
  id: string;
  position: number;
  title: string;
  audience: string;
  minutes: number;
  art: 'doppa' | 'book' | 'music';
  wordId: number;
  paragraphs: string[];
  quiz: QuizQuestion[];
};

export type Course = {
  words: Word[];
  sections: Section[];
  levels: Level[];
  letters: Letter[];
  stories: Story[];
};

export type Progress = {
  name: string;
  avatar: AvatarId;
  xp: number;
  streak: number;
  /** День последнего занятия, YYYY-MM-DD по местному времени */
  lastActiveOn: string | null;
  hearts: number;
  /** Когда последний раз восстанавливали гранаты (мс) */
  heartsUpdatedAt: number;
  levels: Record<string, { stars: number; completedAt: string }>;
  stories: Record<string, { completedAt: string }>;
};
