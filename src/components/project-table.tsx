'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Project, SortConfig } from '@/types';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ProjectTableProps {
  projects: Project[];
  headers: string[];
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  filters: { [key: string]: string };
  onFilterChange: (key: string, value: string) => void;
}

export function ProjectTable({
  projects,
  headers,
  sortConfig,
  onSort,
  filters,
  onFilterChange,
}: ProjectTableProps) {
  const router = useRouter();

  const sortedProjects = useMemo(() => {
    let sortableProjects = [...projects];
    if (sortConfig !== null) {
      sortableProjects.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProjects;
  }, [projects, sortConfig]);

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4 text-accent" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-accent" />;
  };

  const formatCell = (value: any, header: string) => {
    if (header.toLowerCase().includes('history comments') && Array.isArray(value)) {
      return value.length;
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground/50">N/A</span>;
    }
    return String(value);
  }

  const handleRowClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            {headers.map((header) => (
              <TableHead key={header}>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" onClick={() => onSort(header)} className="px-0 justify-start -mb-2">
                    {header}
                    {getSortIcon(header)}
                  </Button>
                  <Input
                    placeholder={`Filter ${header}...`}
                    value={filters[header] || ''}
                    onChange={(e) => onFilterChange(header, e.target.value)}
                    className="h-8"
                  />
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.length > 0 ? (
            sortedProjects.map((project, index) => (
              <TableRow key={project.__id__ || index} onClick={() => handleRowClick(project.__id__!)} className={cn("cursor-pointer", index % 2 === 0 ? 'bg-muted/50' : '')}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                {headers.map((header) => (
                  <TableCell key={header}>
                    {formatCell(project[header], header)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={headers.length + 1}
                className="h-24 text-center text-muted-foreground"
              >
                No results found for your filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
