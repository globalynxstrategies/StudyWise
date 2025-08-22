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
  createdAt: string;
  updatedAt: string;
}
