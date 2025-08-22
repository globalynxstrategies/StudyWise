"use client";

import * as React from "react";
import { useStudyData } from "@/hooks/use-study-data";
import type { Course, Note, Tag } from "@/types";
import { CourseSidebar } from "@/components/studywise/course-sidebar";
import { NoteList } from "@/components/studywise/note-list";
import { NoteEditor } from "@/components/studywise/note-editor";
import { ReviewModal } from "@/components/studywise/review-modal";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "@/components/studywise/command-palette";
import { Notebook, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthGuard from "@/components/auth-guard";

function App() {
  const {
    courses,
    notes,
    tags,
    actions,
  } = useStudyData();

  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>("all");
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);
  const [isReviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    // When the course changes, deselect the note
    setSelectedNoteId(null);
  }, [selectedCourseId]);
  
  const handleAddNewNote = React.useCallback(() => {
    if (selectedCourseId && selectedCourseId !== "all") {
      const newNote = actions.addNote({
        title: "New Note",
        content: "",
        courseId: selectedCourseId,
        tagIds: [],
      });
      setSelectedNoteId(newNote.id);
    } else {
        alert("Please select a course before creating a new note.")
    }
  }, [actions, selectedCourseId]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen((open) => !open)
      }
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleAddNewNote()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [handleAddNewNote])

  const handleSelectCourse = (courseId: string | null) => {
    setSelectedCourseId(courseId);
    setSelectedNoteId(null);
  };
  
  const handleSelectNote = (noteId: string | null) => {
    setSelectedNoteId(noteId);
  };

  const handleTogglePin = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      actions.updateNote(noteId, { isPinned: !note.isPinned });
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

  const handleExportData = () => {
    const data = {
        courses,
        notes,
        tags,
        exportedAt: new Date().toISOString(),
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "studywise_backup.json";
    link.click();
  };

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  }

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
        <div className="flex-shrink-0 border-b p-2 flex items-center justify-end">
            <Button variant="outline" onClick={() => setCommandPaletteOpen(true)}>
                <Search className="mr-2 h-4 w-4" />
                <span>Search...</span>
                <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <NoteList
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onAddNewNote={handleAddNewNote}
            canAddNote={selectedCourseId !== 'all' && selectedCourseId !== null}
            onReview={() => setReviewModalOpen(true)}
            canReview={notesForReview.length > 0}
            onTogglePin={handleTogglePin}
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
                updateNoteReaction={actions.updateNoteReaction}
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
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        setIsOpen={setCommandPaletteOpen}
        courses={courses}
        notes={notes}
        runCommand={runCommand}
        onSelectCourse={handleSelectCourse}
        onSelectNote={handleSelectNote}
        onAddNewNote={handleAddNewNote}
        onAddCourse={(name) => runCommand(() => actions.addCourse(name))}
        onExportData={() => runCommand(handleExportData)}
      />
    </div>
  );
}


export default function Home() {
  return (
    <AuthGuard>
      <App />
    </AuthGuard>
  )
}
