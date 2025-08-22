"use client";

import * as React from "react";
import type { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudyWiseLogo } from "@/components/studywise/studywise-logo";
import { BookCopy, Plus, Trash2, Link as LinkIcon, GraduationCap, FolderUp, ClipboardPaste, BookText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface CourseSidebarProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (id: string | null) => void;
  onAddCourse: (name: string) => void;
  onDeleteCourse: (id: string) => void;
}

const lmsPlatforms = [
    { name: 'Canvas', icon: <GraduationCap className="w-6 h-6" /> },
    { name: 'Moodle', icon: <GraduationCap className="w-6 h-6" /> },
    { name: 'Blackboard', icon: <GraduationCap className="w-6 h-6" /> },
    { name: 'Google Classroom', icon: <GraduationCap className="w-6 h-6" /> },
]

const cloudPlatforms = [
    { name: 'Google Drive', icon: <FolderUp className="w-6 h-6" /> },
    { name: 'Dropbox', icon: <FolderUp className="w-6 h-6" /> },
    { name: 'OneDrive', icon: <FolderUp className="w-6 h-6" /> },
]

const citationManagers = [
    { name: 'Zotero', icon: <BookText className="w-6 h-6" /> },
    { name: 'Mendeley', icon: <BookText className="w-6 h-6" /> },
]


export function CourseSidebar({
  courses,
  selectedCourseId,
  onSelectCourse,
  onAddCourse,
  onDeleteCourse,
}: CourseSidebarProps) {
  const [newCourseName, setNewCourseName] = React.useState("");
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const [isIntegrationsOpen, setIntegrationsOpen] = React.useState(false);
  const { toast } = useToast();
  const sortedCourses = React.useMemo(() => [...courses].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [courses]);

  const handleAddCourse = () => {
    if (newCourseName.trim()) {
      onAddCourse(newCourseName.trim());
      setNewCourseName("");
      setAddDialogOpen(false);
    }
  };
  
  const handleConnect = (name: string) => {
    toast({
        title: `Connecting to ${name}...`,
        description: "This feature is coming soon!",
    })
  }

  return (
    <aside className="w-64 flex flex-col p-4 bg-card/50">
      <div className="flex items-center gap-2 mb-4">
        <StudyWiseLogo className="w-8 h-8" />
        <h1 className="text-xl font-bold">StudyWise</h1>
      </div>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4">
            <Plus className="mr-2 h-4 w-4" /> New Course
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Course</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g. History 101"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCourse}>Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1">
          <Button
            variant={selectedCourseId === "all" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => onSelectCourse("all")}
          >
            All Notes
          </Button>
          {sortedCourses.map((course) => (
            <div key={course.id} className="group relative flex items-center">
              <Button
                variant={selectedCourseId === course.id ? "secondary" : "ghost"}
                className="justify-start w-full pr-8"
                onClick={() => onSelectCourse(course.id)}
              >
                <BookCopy className="mr-2 h-4 w-4" />
                <span className="truncate">{course.name}</span>
              </Button>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute right-1 h-7 w-7 opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the course "{course.name}" and all its notes. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteCourse(course.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator className="my-2" />

       <Dialog open={isIntegrationsOpen} onOpenChange={setIntegrationsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="justify-start">
             <LinkIcon className="mr-2 h-4 w-4" /> Integrations
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect to External Services</DialogTitle>
            <DialogDescription>
              Import your courses and materials directly from your school's LMS, cloud storage, and more.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <h3 className="mb-4 text-lg font-medium">Learning Platforms</h3>
            <div className="space-y-4">
                {lmsPlatforms.map(platform => (
                    <div key={platform.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-4">
                            {platform.icon}
                            <span className="font-medium">{platform.name}</span>
                        </div>
                        <Button variant="secondary" onClick={() => handleConnect(platform.name)}>Connect</Button>
                    </div>
                ))}
            </div>
          </div>

          <Separator />

          <div className="py-2">
            <h3 className="mb-4 text-lg font-medium">Cloud Storage</h3>
            <div className="space-y-4">
                {cloudPlatforms.map(platform => (
                    <div key={platform.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-4">
                            {platform.icon}
                            <span className="font-medium">{platform.name}</span>
                        </div>
                        <Button variant="secondary" onClick={() => handleConnect(platform.name)}>Connect</Button>
                    </div>
                ))}
            </div>
          </div>

          <Separator />
          
          <div className="py-2">
            <h3 className="mb-4 text-lg font-medium">Citation Managers</h3>
            <div className="space-y-4">
                {citationManagers.map(platform => (
                    <div key={platform.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-4">
                            {platform.icon}
                            <span className="font-medium">{platform.name}</span>
                        </div>
                        <Button variant="secondary" onClick={() => handleConnect(platform.name)}>Connect</Button>
                    </div>
                ))}
            </div>
             <p className="text-sm text-muted-foreground px-1 pt-2">
                Connect your favorite citation manager to easily add references to your research notes.
            </p>
          </div>

          <Separator />

          <div className="py-2">
            <h3 className="mb-4 text-lg font-medium">Browser Clipper</h3>
            <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-4">
                        <ClipboardPaste className="w-6 h-6" />
                        <span className="font-medium">Web Clipper</span>
                    </div>
                    <Button variant="secondary" onClick={() => handleConnect("Web Clipper")}>Get Extension</Button>
                </div>
                 <p className="text-sm text-muted-foreground px-1">
                    Clip articles, research, and important webpages directly into your StudyWise notes.
                </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
