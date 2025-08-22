
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import type { Course, Note } from "@/types"
import { File, Folder, PlusCircle, Moon, Sun, Monitor, BookCopy, Home } from "lucide-react"

interface CommandPaletteProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  courses: Course[]
  notes: Note[]
  runCommand: (command: () => void) => void
  onSelectCourse: (id: string | null) => void
  onSelectNote: (id: string) => void
  onAddNewNote: () => void
  onAddCourse: (name: string) => void
}

export function CommandPalette({ 
    isOpen, 
    setIsOpen, 
    courses, 
    notes, 
    runCommand,
    onSelectCourse,
    onSelectNote,
    onAddNewNote,
    onAddCourse,
}: CommandPaletteProps) {
  const { setTheme } = useTheme()

  const handleAddCourse = () => {
    const name = prompt("Enter new course name:")
    if(name) {
        onAddCourse(name)
    }
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(onAddNewNote)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>New Note</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(handleAddCourse)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>New Course</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Navigation">
             <CommandItem onSelect={() => runCommand(() => onSelectCourse("all"))}>
                <Home className="mr-2 h-4 w-4" />
                <span>All Notes</span>
            </CommandItem>
            {courses.map((course) => (
                <CommandItem
                key={course.id}
                onSelect={() => runCommand(() => onSelectCourse(course.id))}
                >
                <Folder className="mr-2 h-4 w-4" />
                <span>{course.name}</span>
                </CommandItem>
            ))}
            {notes.map((note) => (
                <CommandItem
                key={note.id}
                onSelect={() => runCommand(() => onSelectNote(note.id))}
                >
                <File className="mr-2 h-4 w-4" />
                <span>{note.title}</span>
                </CommandItem>
            ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("sepia"))}>
            <BookCopy className="mr-2 h-4 w-4" />
            Sepia
          </CommandItem>
           <CommandItem onSelect={() => runCommand(() => setTheme("high-contrast"))}>
            <Monitor className="mr-2 h-4 w-4" />
            High Contrast
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Monitor className="mr-2 h-4 w-4" />
            System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

