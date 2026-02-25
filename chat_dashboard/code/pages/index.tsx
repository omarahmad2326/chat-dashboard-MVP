import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ConversationList from '@/components/ConversationList';
import ConversationDetail from '@/components/ConversationDetail';
import SearchBar from '@/components/SearchBar';
import { Conversation } from '@/lib/types';

async function fetchConversations(status?: string, search?: string, sort?: string): Promise<Conversation[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);
  if (sort) params.append('sort', sort);
  
  const res = await fetch(`/api/conversations?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const queryClient = useQueryClient();
  
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations', statusFilter, searchQuery, sortBy],
    queryFn: () => fetchConversations(statusFilter, searchQuery, sortBy),
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!conversations || conversations.length === 0) return;

      // Don't interfere with typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }

      const currentIndex = selectedId 
        ? conversations.findIndex(c => c.id === selectedId)
        : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < conversations.length - 1) {
          setSelectedId(conversations[currentIndex + 1].id);
        } else if (currentIndex === -1 && conversations.length > 0) {
          setSelectedId(conversations[0].id);
        }
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedId(conversations[currentIndex - 1].id);
        }
      }

      if (e.key === 'Enter' && currentIndex === -1 && conversations.length > 0) {
        setSelectedId(conversations[0].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations, selectedId]);

  return (
    <div className="dashboard">
      <ConversationList
        conversations={conversations}
        isLoading={isLoading}
        error={error}
        selectedId={selectedId}
        onSelect={setSelectedId}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <ConversationDetail 
        conversationId={selectedId}
        onMessageSent={() => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }}
      />
    </div>
  );
}
