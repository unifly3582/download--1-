'use client';

import { useState } from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { auth } from '@/lib/firebase/client';
import { dataSearchWithLLM, type DataSearchWithLLMOutput } from '@/ai/flows/data-search-with-llm';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchDialog } from './search-dialog';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<DataSearchWithLLMOutput | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    try {
      const result = await dataSearchWithLLM({ query: searchQuery });
      setSearchResult(result);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('AI Search Error:', error);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'The AI search could not be completed. Please try again.',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'AD';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Ask AI to find anything..."
              className="w-full appearance-none bg-card pl-8 shadow-none md:w-2/3 lg:w-1/3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
            />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  You have no new notifications.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || ''} alt="User avatar" />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Settings</DropdownMenuItem>
            <DropdownMenuItem disabled>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SearchDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        query={searchQuery}
        result={searchResult}
        isLoading={isSearching}
      />
    </header>
  );
}
