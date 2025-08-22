"use client";

import * as React from "react";
import { useStudyData } from "@/hooks/use-study-data";
import type { Note } from "@/types";
import { CourseSidebar } from "@/components/studywise/course-sidebar";
import { NoteList } from "@/components/studywise/note-list";
import { NoteEditor } from "@/components/studywise/note-editor";
import { ReviewModal } from "@/components/studywise/review-modal";
import { Separator } from "@/components/ui/separator";
import { Notebook, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const {
    courses,
    notes,
    tags,
    actions,
  } = useStudyData();

  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>("all");
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);
  const [isReviewModalOpen, setReviewModalOpen] = React.useState(false);

  React.useEffect(() => {
    // When the course changes, deselect the note
    setSelectedNoteId(null);
  }, [selectedCourseId]);

  const handleSelectCourse = (courseId: string | null) => {
    setSelectedCourseId(courseId);
    setSelectedNoteId(null);
  };
  
  const handleSelectNote = (noteId: string | null) => {
    setSelectedNoteId(noteId);
  };

  const handleAddNewNote = () => {
    if (selectedCourseId && selectedCourseId !== "all") {
      const newNote = actions.addNote({
        title: "New Note",
        content: "",
        courseId: selectedCourseId,
        tagIds: [],
      });
      setSelectedNoteId(newNote.id);
    }
  };

  const filteredNotes = React.useMemo(() => {
    if (!selectedCourseId || selectedCourseId === "all") {
      return notes;
    }
    return notes.filter((note) => note.courseId === selectedCourseId);
  }, [notes, selectedCourseId]);

  const selectedNote = React.useMemo(() => {
    return notes.find((note) => note.id === selectedNoteId) ?? null;
  }, [notes, selectedNoteId]);

  const notesForReview = React.useMemo(() => {
    return selectedCourseId && selectedCourseId !== 'all'
      ? notes.filter(n => n.courseId === selectedCourseId)
      : [];
  }, [notes, selectedCourseId]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <CourseSidebar
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={handleSelectCourse}
        onAddCourse={actions.addCourse}
        onDeleteCourse={actions.deleteCourse}
      />
      <Separator orientation="vertical" />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex overflow-hidden">
          <NoteList
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onAddNewNote={handleAddNewNote}
            canAddNote={selectedCourseId !== 'all' && selectedCourseId !== null}
            onReview={() => setReviewModalOpen(true)}
            canReview={notesForReview.length > 0}
          />
          <Separator orientation="vertical" />
          <div className="flex-1 flex flex-col overflow-y-auto">
            {selectedNote ? (
              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                allTags={tags}
                updateNote={actions.updateNote}
                deleteNote={(id) => {
                  actions.deleteNote(id);
                  setSelectedNoteId(null);
                }}
                createTag={actions.addTag}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <Notebook className="w-20 h-20 mb-4" />
                <h2 className="text-2xl font-semibold text-foreground">Select a note to view</h2>
                <p className="mt-2 max-w-sm">Or, choose a course and create a new note to get started on your studies!</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {notesForReview.length > 0 && (
          <ReviewModal
            notes={notesForReview}
            isOpen={isReviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
          />
      )}
    </div>
  );
}
