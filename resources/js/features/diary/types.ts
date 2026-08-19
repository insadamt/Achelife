export interface TextNode {
    type: 'text';
    text: string;
}

export interface MentionNode {
    type: 'mention';
    personId: number;
    label: string;
}

export type DiaryContentNode = TextNode | MentionNode;
export type DiaryDayState = 'completed' | 'missed' | 'pending' | 'unavailable';
export type DiarySaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface DiaryDay {
    date: string;
    state: DiaryDayState;
    editable: boolean;
    locked: boolean;
    content: DiaryContentNode[];
    plainText: string;
    characterCount: number;
    languageCode: string | null;
    languageName: string | null;
    direction: 'ltr' | 'rtl';
    mood: string | null;
    moodGroup: string | null;
    streakAfter: number;
    multiplier: string;
    earnedSp: number;
    clientRevision: number;
    updatedAt: string | null;
}

export interface CalendarDay extends DiaryDay {
    inMonth: boolean;
}

export interface DiaryCalendarData {
    month: string;
    label: string;
    year: number;
    days: CalendarDay[];
}

export interface DiaryPerson {
    id: number;
    name: string;
    nickname: string | null;
    note: string | null;
    archived: boolean;
    mentionCount: number;
    recentEntries: Array<{ date: string; excerpt: string }>;
}

export interface DiaryLanguage {
    code: string;
    name: string;
    direction: 'ltr' | 'rtl';
}

export interface DiarySearchResult {
    date: string;
    excerpt: string;
    mood: string | null;
    languageCode: string | null;
    languageName: string | null;
    completed: boolean;
}

export interface DiarySearchData {
    query: string;
    mood: string | null;
    language: string | null;
    person: number | null;
    results: DiarySearchResult[];
}

export interface DiarySaveResult {
    date: string;
    state: DiaryDayState;
    characterCount: number;
    languageCode: string | null;
    languageName: string | null;
    mood: string | null;
    moodGroup: string | null;
    streakAfter: number;
    multiplier: string;
    earnedSp: number;
    seasonPoints: number;
}

export type MoodCatalog = Record<string, string[]>;
