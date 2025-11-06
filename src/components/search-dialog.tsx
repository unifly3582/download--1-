'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';
import type { DataSearchWithLLMOutput } from '@/ai/flows/data-search-with-llm';

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  query: string;
  result: DataSearchWithLLMOutput | null;
  isLoading: boolean;
}

export function SearchDialog({ isOpen, onOpenChange, query, result, isLoading }: SearchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>AI Search Results</DialogTitle>
          <DialogDescription>
            Showing results for: <span className="font-semibold text-foreground">"{query}"</span>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground">
              {result ? (
                <p>{result.searchResult}</p>
              ) : (
                <p>No results found or an error occurred.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
