import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreVertical, ArrowLeftRight, Edit2, Trash2 } from 'lucide-react';
import { type Project } from '@shared/schema';

interface SortableProjectItemProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onMove: (project: Project) => void;
}

function SortableProjectItem({ project, onEdit, onDelete, onMove }: SortableProjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const otherStatus = project.status === 'finished' ? 'Ongoing' : 'Finished';

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`glass-effect border-gray-600 ${isDragging ? 'shadow-lg shadow-royal-500/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-700/50 transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Project Image */}
            <div className="flex-shrink-0">
              {project.imageUrl ? (
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-16 h-16 object-cover rounded border border-gray-600"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Im0xNSAxMi0zIDMtMyAtMyIgc3Ryb2tlPSIjNmI3Mjg4IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{project.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{project.category}</p>
                  {project.simplifiedDescription && (
                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                      {project.simplifiedDescription}
                    </p>
                  )}
                </div>

                {/* Sort Order Badge */}
                <div className="flex-shrink-0">
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    #{project.sortOrder}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Three-dot Action Menu */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass-effect border-gray-600 text-gray-300 hover:text-white h-8 w-8 p-0"
                  >
                    <MoreVertical size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-gray-900 border-gray-700 text-gray-200 min-w-[180px]"
                >
                  <DropdownMenuItem
                    onClick={() => onMove(project)}
                    className="gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                  >
                    <ArrowLeftRight size={14} className="text-blue-400" />
                    Move to {otherStatus}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    onClick={() => onEdit(project)}
                    className="gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                  >
                    <Edit2 size={14} />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(project.id.toString())}
                    className="gap-2 cursor-pointer text-red-400 hover:bg-gray-800 focus:bg-gray-800 focus:text-red-400"
                  >
                    <Trash2 size={14} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DraggableProjectListProps {
  projects: Project[];
  onReorder: (projects: Project[]) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onMove: (project: Project) => void;
}

export default function DraggableProjectList({
  projects,
  onReorder,
  onEdit,
  onDelete,
  onMove,
}: DraggableProjectListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = projects.findIndex((project) => project.id.toString() === active.id);
      const newIndex = projects.findIndex((project) => project.id.toString() === over?.id);

      const reorderedProjects = arrayMove(projects, oldIndex, newIndex);

      const updatedProjects = reorderedProjects.map((project, index) => ({
        ...project,
        sortOrder: index + 1
      }));

      onReorder(updatedProjects);
    }
  }

  if (!projects || projects.length === 0) {
    return (
      <Card className="glass-effect border-gray-600">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No projects in this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={projects.map(p => p.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {projects.map((project) => (
            <SortableProjectItem
              key={project.id}
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
