"use client";

import * as React from "react";
import type { Note, Tag } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, X, Plus, Sparkles, Loader2, HelpCircle, Bold, Italic, List, Heading, Highlighter, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { processNote } from "@/ai/flows/note-processor-flow";

type AIAction = "summarize" | "generate_questions";

interface NoteEditorProps {
  note: Note;
  allTags: Tag[];
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  createTag: (name: string) => Tag;
}

const renderMarkdown = (markdown: string) => {
    let html = markdown.replace(/\n/g, '<br />');
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="my-4 rounded-md max-w-full" />');
    html = html.replace(/==(.*?)==/g, '<mark>$1</mark>');
    return html;
}

export function NoteEditor({ note, allTags, updateNote, deleteNote, createTag }: NoteEditorProps) {
  const [title, setTitle] = React.useState(note.title);
  const [content, setContent] = React.useState(note.content);
  const [tagInput, setTagInput] = React.useState("");
  const { toast } = useToast();
  const contentRef = React.useRef<HTMLTextAreaElement>(null);

  const [isAiSheetOpen, setAiSheetOpen] = React.useState(false);
  const [aiAction, setAiAction] = React.useState<AIAction | null>(null);
  const [aiContent, setAiContent] = React.useState("");
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const [isImageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [imageAlt, setImageAlt] = React.useState("");

  const noteTags = React.useMemo(() => {
    return allTags.filter(tag => note.tagIds.includes(tag.id));
  }, [allTags, note.tagIds]);

  const handleTitleBlur = () => {
    if (title.trim() === "") {
        toast({ title: "Title cannot be empty.", variant: "destructive" });
        setTitle(note.title);
        return;
    }
    if (title !== note.title) {
      updateNote(note.id, { title });
      toast({ title: "Note saved!" });
    }
  };

  const handleContentBlur = () => {
    if (content !== note.content) {
      updateNote(note.id, { content });
      toast({ title: "Note saved!" });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() === "") return;
    const newOrExistingTag = createTag(tagInput.trim());
    if (!note.tagIds.includes(newOrExistingTag.id)) {
      updateNote(note.id, { tagIds: [...note.tagIds, newOrExistingTag.id] });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagIdToRemove: string) => {
    updateNote(note.id, {
      tagIds: note.tagIds.filter((id) => id !== tagIdToRemove),
    });
  };

  const applyMarkdown = (syntax: { pre: string; post: string }) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const newText = `${value.substring(0, selectionStart)}${syntax.pre}${selectedText}${syntax.post}${value.substring(selectionEnd)}`;
    setContent(newText);
    textarea.focus();
    setTimeout(() => {
      textarea.selectionStart = selectionStart + syntax.pre.length;
      textarea.selectionEnd = selectionEnd + syntax.pre.length;
    }, 0);
  };
  
  const handleAiAction = async (action: AIAction) => {
    if (!note.content.trim()) {
      toast({ title: "Note content is empty.", description: "Please write some notes first before using AI features.", variant: "destructive" });
      return;
    }
    setAiAction(action);
    setAiSheetOpen(true);
    setIsAiLoading(true);
    setAiContent("");
    try {
      const result = await processNote({ noteContent: note.content, action });
      setAiContent(result.processedContent);
    } catch (error) {
      console.error("AI action failed", error);
      toast({ title: "AI action failed", description: "Could not process the note. Please try again.", variant: "destructive" });
      setAiContent("Sorry, there was an error. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  }

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      const imageMarkdown = `\n![${imageAlt.trim()}](${imageUrl.trim()})\n`;
      setContent(prev => prev + imageMarkdown);
      setImageUrl("");
      setImageAlt("");
      setImageDialogOpen(false);
    }
  };

  const sheetTitle = aiAction === 'summarize' ? "Note Summary" : "Generated Questions";
  const sheetDescription = aiAction === 'summarize' ? "Here is a summary of your note." : "Here are some questions based on your note to test your knowledge.";

  return (
    <div className="flex-1 flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
          aria-label="Note title"
        />
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAiAction("summarize")}>
                <Sparkles className="h-4 w-4 mr-2" />
                Summarize
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAiAction("generate_questions")}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Generate Questions
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this note. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteNote(note.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      <div className="flex items-center gap-1 border rounded-md p-1">
         <Button title="Bold" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown({ pre: '**', post: '**' })}><Bold className="h-4 w-4" /></Button>
         <Button title="Italic" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown({ pre: '_', post: '_' })}><Italic className="h-4 w-4" /></Button>
         <Button title="Highlight" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown({ pre: '==', post: '==' })}><Highlighter className="h-4 w-4" /></Button>
         <Button title="Bulleted List" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown({ pre: '\n- ', post: '' })}><List className="h-4 w-4" /></Button>
         <Button title="Heading" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown({ pre: '\n### ', post: '' })}><Heading className="h-4 w-4" /></Button>
         <Dialog open={isImageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild>
                <Button title="Add Image" variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add Image</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                    <Input placeholder="Image description (for alt text)" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddImage}>Add Image</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>

      <Textarea
        ref={contentRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleContentBlur}
        placeholder="Start writing your note here... Markdown is supported."
        className="flex-1 text-base resize-none"
        aria-label="Note content"
      />
      
      <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/20" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}/>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2">
          {noteTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="pl-3 pr-1">
              {tag.name}
              <button onClick={() => handleRemoveTag(tag.id)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add a new tag..."
            className="h-8"
          />
          <Button size="sm" onClick={handleAddTag}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>
      </div>
      <Sheet open={isAiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent className="sm:max-w-xl">
            <SheetHeader>
                <SheetTitle>{sheetTitle}</SheetTitle>
                <SheetDescription>{sheetDescription}</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-80px)] mt-4 pr-4">
                {isAiLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: aiContent.replace(/\n/g, '<br />') }}/>
                )}
            </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
