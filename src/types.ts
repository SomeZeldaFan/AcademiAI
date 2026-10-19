export type ModuleId = 'prompting' | 'context' | 'verification';
export type Answer = string | Record<string, string>;
export interface Choice {
  id: string;
  text: string;
}
interface QuestionBase {
  id: string;
  prompt: string;
  scenario?: string;
}
export interface ChoiceQuestion extends QuestionBase {
  type: 'single' | 'compare';
  options: Choice[];
  correct: string;
}
export interface MatchQuestion extends QuestionBase {
  type: 'matching';
  left: Choice[];
  right: Choice[];
  correct: Record<string, string>;
}
export type Question = ChoiceQuestion | MatchQuestion;
export interface LessonSection {
  title: string;
  paragraphs: string[];
  sources?: number[];
}
export interface CourseModule {
  id: ModuleId;
  title: string;
  shortTitle: string;
  subject: string;
  owner: string;
  accent: string;
  description: string;
  outcomes: string[];
  sections: LessonSection[];
  example: {
    title: string;
    context: string;
    before?: string;
    request: string;
    result: string[];
    note?: string;
  };
  sources: number[];
  questions: Question[];
}
export interface ModuleResult {
  best: number;
  last: number;
  earnedAt: string | null;
}
export interface Progress {
  version: 1;
  results: Partial<Record<ModuleId, ModuleResult>>;
  placed: ModuleId[];
  celebrated: boolean;
}
export interface Submission {
  answer: Answer;
}
export interface Attempt {
  id: string;
  moduleId: ModuleId;
  index: number;
  submissions: Submission[];
}
