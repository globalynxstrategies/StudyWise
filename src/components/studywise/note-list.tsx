"use client";

import * as React from "react";
import type { Note } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, BookOpenCheck, FileText, Pin, PinOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onAddNewNote: () => void;
  canAddNote: boolean;
  onReview: () => void;
  canReview: boolean;
  onTogglePin: (id: string) => void;
}

function NoteCard({ note, isSelected, onSelect, onTogglePin }: { note: Note, isSelected: boolean, onSelect: (id: string) => void, onTogglePin: (id: string) => void }) {
  return (
    <Card
      onClick={() => onSelect(note.id)}
      className={`group cursor-pointer transition-colors hover:bg-secondary/50 ${
        isSelected ? "bg-secondary border-primary/50" : ""
      }`}
    >
      <CardHeader className="p-4 relative">
        <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
            }}
        >
            {note.isPinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
        </Button>
        <CardTitle className="text-lg truncate pr-8">{note.title}</CardTitle>
        <CardDescription>
          {new Date(note.updatedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onAddNewNote,
  canAddNote,
  onReview,
  canReview,
  onTogglePin,
}: NoteListProps) {
  
  const { pinnedNotes, otherNotes } = React.useMemo(() => {
    const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return {
      pinnedNotes: sortedNotes.filter(n => n.isPinned),
      otherNotes: sortedNotes.filter(n => !n.isPinned),
    }
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
        {notes.length > 0 ? (
          <div className="p-4 space-y-3">
            {pinnedNotes.length > 0 && (
              <>
                {pinnedNotes.map((note) => (
                  <NoteCard key={note.id} note={note} isSelected={selectedNoteId === note.id} onSelect={onSelectNote} onTogglePin={onTogglePin} />
                ))}
                <div className="relative py-2">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card/50 px-2 text-xs text-muted-foreground">Pinned</span>
                </div>
              </>
            )}
            {otherNotes.map((note) => (
              <NoteCard key={note.id} note={note} isSelected={selectedNoteId === note.id} onSelect={onSelectNote} onTogglePin={onTogglePin} />
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
