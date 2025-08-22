"use client";

import * as React from "react";
import type { Note } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, RefreshCw, X } from "lucide-react";

interface ReviewModalProps {
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
}

const renderMarkdownForReview = (markdown: string) => {
    let html = markdown.replace(/\n/g, '<br />');
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="my-4 rounded-md max-w-full" />');
    html = html.replace(/==(.*?)==/g, '<mark>$1</mark>');
    return html;
}

export function ReviewModal({ notes, isOpen, onClose }: ReviewModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [shuffledNotes, setShuffledNotes] = React.useState<Note[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setShuffledNotes([...notes].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen, notes]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledNotes.length);
    }, 150); // wait for flip animation
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + shuffledNotes.length) % shuffledNotes.length);
    }, 150);
  };
  
  if (!isOpen || shuffledNotes.length === 0) return null;
  
  const currentNote = shuffledNotes[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Mode</DialogTitle>
        </DialogHeader>
        <div className="py-8 flex flex-col items-center justify-center">
            <div 
              className="w-full h-80 perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div 
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
              >
                {/* Front of card */}
                <Card className="absolute w-full h-full backface-hidden flex items-center justify-center">
                  <CardHeader>
                    <CardTitle className="text-2xl text-center">{currentNote.title}</CardTitle>
                  </CardHeader>
                </Card>
                {/* Back of card */}
                <Card className="absolute w-full h-full backface-hidden rotate-y-180 overflow-y-auto">
                    <CardContent className="p-6 prose dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdownForReview(currentNote.content) }} />
                    </CardContent>
                </Card>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Click card to flip</p>
        </div>
        <DialogFooter className="flex justify-between w-full">
            <div className="text-sm text-muted-foreground">
                Card {currentIndex + 1} of {shuffledNotes.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrev}><ArrowLeft className="h-4 w-4" /></Button>
              <Button onClick={() => setIsFlipped(!isFlipped)}><RefreshCw className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={handleNext}><ArrowRight className="h-4 w-4" /></Button>
            </div>
            <Button variant="secondary" onClick={onClose}><X className="h-4 w-4 mr-2" /> Finish</Button>
        </DialogFooter>
        <style jsx>{`
            .perspective-1000 { perspective: 1000px; }
            .transform-style-3d { transform-style: preserve-3d; }
            .rotate-y-180 { transform: rotateY(180deg); }
            .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
