export interface Course {
  id: string;
  name: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown content
  courseId: string;
  tagIds: string[];
  isPinned: boolean;
  videoUrl?: string; // Optional YouTube video URL
  reactions?: { [key: string]: number }; // e.g. { "👍": 1, "❤️": 5 }
  createdAt: string;
  updatedAt: string;
}
