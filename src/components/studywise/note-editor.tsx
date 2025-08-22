"use client";

import * as React from "react";
import type { Note, Tag } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, X, Plus, Sparkles, Loader2, HelpCircle, Bold, Italic, List, Heading, Highlighter, Image as ImageIcon, Code, Sigma, Layers, Youtube, Clock } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
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
import { processNote, generateFlashcards } from "@/ai/flows/note-processor-flow";
import type { Flashcard } from "@/ai/flows/note-processor-flow";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";

type AIAction = "summarize" | "generate_questions" | "generate_flashcards";

interface NoteEditorProps {
  note: Note;
  allTags: Tag[];
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  createTag: (name: string) => Tag;
  updateNoteReaction: (noteId: string, emoji: string) => void;
}

const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const availableReactions = ['👍', '❤️', '💡', '🔥', '🤔', '🎉'];

export function NoteEditor({ note, allTags, updateNote, deleteNote, createTag, updateNoteReaction }: NoteEditorProps) {
  const [title, setTitle] = React.useState(note.title);
  const [content, setContent] = React.useState(note.content);
  const [tagInput, setTagInput] = React.useState("");
  const { toast } = useToast();
  const contentRef = React.useRef<HTMLTextAreaElement>(null);
  const playerRef = React.useRef<any>(null); // To hold the YouTube player instance
  const debouncedContent = useDebounce(content, 500);

  const [isAiSheetOpen, setAiSheetOpen] = React.useState(false);
  const [aiAction, setAiAction] = React.useState<AIAction | null>(null);
  const [aiContent, setAiContent] = React.useState("");
  const [generatedFlashcards, setGeneratedFlashcards] = React.useState<Flashcard[]>([]);
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const [isImageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [imageAlt, setImageAlt] = React.useState("");
  
  const [isVideoDialogOpen, setVideoDialogOpen] = React.useState(false);
  const [videoUrlInput, setVideoUrlInput] = React.useState(note.videoUrl || "");

  const noteTags = React.useMemo(() => {
    return allTags.filter(tag => note.tagIds.includes(tag.id));
  }, [allTags, note.tagIds]);

  const videoId = React.useMemo(() => getYouTubeVideoId(note.videoUrl || ''), [note.videoUrl]);
  
  // Load YouTube Iframe API
  React.useEffect(() => {
    if (videoId) {
      const tag = document.createElement('script');
      if (!window.YT) {
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }

      const createPlayer = () => {
        if (window.YT && window.YT.Player) {
          playerRef.current = new window.YT.Player(`youtube-player-${note.id}`, {
            height: '390',
            width: '100%',
            videoId: videoId,
          });
        }
      };

      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = createPlayer;
      } else {
        createPlayer();
      }
      
      return () => {
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }
      };
    }
  }, [videoId, note.id]);


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

  React.useEffect(() => {
    if (debouncedContent !== note.content) {
      updateNote(note.id, { content: debouncedContent });
      toast({ title: "Note saved!" });
    }
  }, [debouncedContent, note.id, note.content, updateNote, toast]);


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
  
  const formatTime = (seconds: number): string => {
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleInsertTimestamp = () => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime();
        const timestamp = formatTime(currentTime);
        const timestampMarkdown = `[${timestamp}] `;
        
        const textarea = contentRef.current;
        if (!textarea) return;
        
        const { selectionStart, value } = textarea;
        const newText = `${value.substring(0, selectionStart)}${timestampMarkdown}${value.substring(selectionStart)}`;
        setContent(newText);
        
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = selectionStart + timestampMarkdown.length;
          textarea.selectionEnd = selectionStart + timestampMarkdown.length;
        }, 0);
    }
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
    setGeneratedFlashcards([]);

    try {
        if (action === 'generate_flashcards') {
            const result = await generateFlashcards({ noteContent: note.content });
            setGeneratedFlashcards(result.flashcards);
        } else {
            const result = await processNote({ noteContent: note.content, action });
            setAiContent(result.processedContent);
        }
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

  const handleSetVideoUrl = () => {
    const newVideoId = getYouTubeVideoId(videoUrlInput);
    if(videoUrlInput && !newVideoId) {
        toast({ title: "Invalid YouTube URL", description: "Please enter a valid YouTube video URL.", variant: "destructive" });
        return;
    }
    updateNote(note.id, { videoUrl: videoUrlInput });
    setVideoDialogOpen(false);
  }

  let sheetTitle = "";
  let sheetDescription = "";
  if (aiAction === 'summarize') {
    sheetTitle = "Note Summary";
    sheetDescription = "Here is a summary of your note.";
  } else if (aiAction === 'generate_questions') {
    sheetTitle = "Generated Questions";
    sheetDescription = "Here are some questions based on your note to test your knowledge.";
  } else if (aiAction === 'generate_flashcards') {
    sheetTitle = "Generated Flashcards";
    sheetDescription = "Review the generated flashcards below.";
  }
  
  const handleTimestampClick = (time: string) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        const [minutes, seconds] = time.split(':').map(Number);
        const timeInSeconds = (minutes * 60) + seconds;
        playerRef.current.seekTo(timeInSeconds, true);
        playerRef.current.playVideo();
    }
  }

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    p(props: any) {
        const { children } = props;
        if (typeof children === 'string' && children.includes('$')) {
            return <p><Latex>{children}</Latex></p>;
        }
        if (Array.isArray(children)) {
            const newChildren = React.Children.map(children, child => {
                if (typeof child === 'string') {
                    // Match [MM:SS] timestamps
                    const parts = child.split(/(\[\d{2}:\d{2}\])/g);
                    return parts.map((part, index) => {
                        const match = part.match(/^\[(\d{2}:\d{2})\]$/);
                        if (match) {
                            return (
                                <Button key={index} variant="link" className="p-0 h-auto font-normal" onClick={() => handleTimestampClick(match[1])}>
                                    {`[${match[1]}]`}
                                </Button>
                            );
                        }
                        return part.includes('$') ? <Latex key={index}>{part}</Latex> : part;
                    });
                }
                return child;
            });
            return <p>{newChildren}</p>;
        }
        return <p>{children}</p>
    },
    li(props: any) {
        const { children } = props;
         if (Array.isArray(children)) {
             const newChildren = React.Children.map(children, child => {
                if (typeof child === 'string') {
                    // Match [MM:SS] timestamps
                    const parts = child.split(/(\[\d{2}:\d{2}\])/g);
                    return parts.map((part, index) => {
                        const match = part.match(/^\[(\d{2}:\d{2})\]$/);
                        if (match) {
                            return (
                                <Button key={index} variant="link" className="p-0 h-auto font-normal" onClick={() => handleTimestampClick(match[1])}>
                                    {`[${match[1]}]`}
                                </Button>
                            );
                        }
                        return part.includes('$') ? <Latex key={index}>{part}</Latex> : part;
                    });
                }
                return child;
            });
            return <li>{newChildren}</li>;
        }
        return <li>{children}</li>
    }
  };


  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
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
                    Questions
                </Button>
                 <Button variant="outline" size="sm" onClick={() => handleAiAction("generate_flashcards")}>
                    <Layers className="h-4 w-4 mr-2" />
                    Flashcards
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
            <Button title="Code Block" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown({ pre: '\n```\n', post: '\n```\n' })}><Code className="h-4 w-4" /></Button>
            <Button title="LaTeX/Math" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown({ pre: '$', post: '$' })}><Sigma className="h-4 w-4" /></Button>

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
            <Dialog open={isVideoDialogOpen} onOpenChange={setVideoDialogOpen}>
                <DialogTrigger asChild>
                    <Button title="Add YouTube Video" variant="ghost" size="icon" className="h-8 w-8"><Youtube className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add YouTube Video</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="YouTube Video URL" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSetVideoUrl}>Set Video</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {videoId && (
          <div className="p-4 border-b">
              <div id={`youtube-player-${note.id}`} className="w-full aspect-video bg-black rounded-md mb-2"></div>
              <Button onClick={handleInsertTimestamp} size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Add Timestamp
              </Button>
          </div>
      )}
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <ScrollArea className="h-full">
            <Textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your note here... Markdown is supported."
                className="flex-1 text-base resize-none h-full border-0 rounded-none focus-visible:ring-0"
                aria-label="Note content"
            />
        </ScrollArea>
        <div className="border-l h-full">
            <ScrollArea className="h-full">
                <div 
                    className="prose dark:prose-invert max-w-none p-6" 
                >
                   <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                    >
                        {content.replace(/==(.*?)==/g, '<mark>$1</mark>')}
                    </ReactMarkdown>
                </div>
            </ScrollArea>
        </div>
      </div>

      <div className="p-4 border-t space-y-4">
        <div>
            <label className="text-sm font-medium mb-2 block">Reactions</label>
            <div className="flex flex-wrap gap-2">
                {availableReactions.map(emoji => (
                    <Button 
                        key={emoji}
                        variant="outline"
                        size="sm"
                        onClick={() => updateNoteReaction(note.id, emoji)}
                        className="relative"
                    >
                        <span className="text-lg">{emoji}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{note.reactions?.[emoji] || 0}</span>
                    </Button>
                ))}
            </div>
        </div>
        <Separator />
        <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2 mt-2">
            {noteTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="pl-3 pr-1">
                {tag.name}
                <button onClick={() => handleRemoveTag(tag.id)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                    <X className="h-3 w-3" />
                </button>
                </Badge>
            ))}
            </div>
            <div className="flex gap-2 mt-2">
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
      </div>
      <Sheet open={isAiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl">
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
                    <>
                        {aiAction === 'generate_flashcards' ? (
                            <FlashcardViewer flashcards={generatedFlashcards} />
                        ) : (
                            <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: aiContent.replace(/\n/g, '<br />') }}/>
                        )}
                    </>
                )}
            </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FlashcardViewer({ flashcards }: { flashcards: Flashcard[] }) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isFlipped, setIsFlipped] = React.useState(false);
  
    if (!flashcards.length) {
      return <p>No flashcards generated.</p>;
    }
  
    const handleNext = () => {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % flashcards.length);
      }, 150);
    };
  
    const handlePrev = () => {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
      }, 150);
    };
  
    const currentCard = flashcards[currentIndex];
  
    return (
      <div className="flex flex-col gap-4 items-center">
        <div 
          className="w-full h-80 perspective-1000 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div 
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* Front of card */}
            <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6">
                <p className="text-xl text-center">{currentCard.question}</p>
            </Card>
            {/* Back of card */}
            <Card className="absolute w-full h-full backface-hidden rotate-y-180 overflow-y-auto p-6">
                <p className="text-center">{currentCard.answer}</p>
            </Card>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Click card to flip</p>
        <div className="flex justify-between w-full items-center">
          <div className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev}><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => setIsFlipped(!isFlipped)}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleNext}><ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <style jsx>{`
            .perspective-1000 { perspective: 1000px; }
            .transform-style-3d { transform-style: preserve-3d; }
            .rotate-y-180 { transform: rotateY(180deg); }
            .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        `}</style>
      </div>
    );
  }

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
