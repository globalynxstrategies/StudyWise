"use client";

import * as React from "react";
import type { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudyWiseLogo } from "@/components/studywise/studywise-logo";
import { BookCopy, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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

interface CourseSidebarProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (id: string | null) => void;
  onAddCourse: (name: string) => void;
  onDeleteCourse: (id: string) => void;
}

export function CourseSidebar({
  courses,
  selectedCourseId,
  onSelectCourse,
  onAddCourse,
  onDeleteCourse,
}: CourseSidebarProps) {
  const [newCourseName, setNewCourseName] = React.useState("");
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const sortedCourses = React.useMemo(() => [...courses].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [courses]);

  const handleAddCourse = () => {
    if (newCourseName.trim()) {
      onAddCourse(newCourseName.trim());
      setNewCourseName("");
      setAddDialogOpen(false);
    }
  };

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
    </aside>
  );
}
