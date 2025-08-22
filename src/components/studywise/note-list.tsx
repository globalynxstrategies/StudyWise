"use client";

import * as React from "react";
import type { Note } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, BookOpenCheck, FileText } from "lucide-react";

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onAddNewNote: () => void;
  canAddNote: boolean;
  onReview: () => void;
  canReview: boolean;
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onAddNewNote,
  canAddNote,
  onReview,
  canReview
}: NoteListProps) {
  
  const sortedNotes = React.useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes]);

  return (
    <div className="w-96 flex flex-col border-r bg-card/50">
      <div className="p-4 flex gap-2 border-b">
        <Button onClick={onAddNewNote} disabled={!canAddNote} className="flex-1">
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
        <Button onClick={onReview} disabled={!canReview} variant="outline">
          <BookOpenCheck className="mr-2 h-4 w-4" /> Review
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {sortedNotes.length > 0 ? (
          <div className="p-4 space-y-3">
            {sortedNotes.map((note) => (
              <Card
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`cursor-pointer transition-colors hover:bg-secondary/50 ${
                  selectedNoteId === note.id ? "bg-secondary" : ""
                }`}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-lg truncate">{note.title}</CardTitle>
                  <CardDescription>
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <FileText className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No notes here</h3>
            <p className="text-sm">
                {canAddNote ? "Create a new note to get started!" : "Select a course to see its notes."}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
