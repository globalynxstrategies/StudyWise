"use client";

import { useState, useEffect, useCallback } from "react";
import type { Course, Note, Tag } from "@/types";

const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T>(key: string, value: T) => {
  if (typeof window === "undefined") {
    console.warn(`Tried to save to localStorage on server: key "${key}"`);
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
};


export function useStudyData() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCourses(getFromLocalStorage<Course[]>("studywise-courses", []));
    setNotes(getFromLocalStorage<Note[]>("studywise-notes", []));
    setTags(getFromLocalStorage<Tag[]>("studywise-tags", []));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if(isLoaded) {
      saveToLocalStorage("studywise-courses", courses);
    }
  }, [courses, isLoaded]);

  useEffect(() => {
    if(isLoaded) {
      saveToLocalStorage("studywise-notes", notes);
    }
  }, [notes, isLoaded]);

  useEffect(() => {
    if(isLoaded) {
      saveToLocalStorage("studywise-tags", tags);
    }
  }, [tags, isLoaded]);

  const addCourse = useCallback((name: string): Course => {
    const newCourse: Course = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);
    return newCourse;
  }, []);

  const deleteCourse = useCallback((courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    // Also delete associated notes
    setNotes((prev) => prev.filter((n) => n.courseId !== courseId));
  }, []);

  const addNote = useCallback((data: Omit<Note, "id" | "createdAt" | "updatedAt">): Note => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    );
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  const addTag = useCallback((name: string): Tag => {
    const existingTag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existingTag) return existingTag;
    
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, [tags]);

  return {
    courses,
    notes,
    tags,
    actions: {
      addCourse,
      deleteCourse,
      addNote,
      updateNote,
      deleteNote,
      addTag,
    },
  };
}
