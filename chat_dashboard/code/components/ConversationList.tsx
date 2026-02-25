import { Conversation } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  conversations?: Conversation[];
  isLoading: boolean;
  error: any;
  selectedId: string | null;
  onSelect: (id: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export default function ConversationList({ 
  conversations, 
  isLoading, 
  error, 
  selectedId, 
  onSelect,
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange
}: Props) {
  return (
    <div className="conversation-list">
      <div className="list-header">
        <h1>Conversations</h1>
        <div className="filters">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          <div className="filter-row">
            <select 
              value={statusFilter} 
              onChange={(e) => onStatusChange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => onSortChange(e.target.value)}
              className="filter-select"
            >
              <option value="recent">Most Recent</option>
              <option value="revenue">Revenue</option>
              <option value="unread">Unread</option>
            </select>
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="loading-state">Loading conversations...</div>
      )}

      {error && (
        <div className="error-state">Failed to load conversations</div>
      )}

      {!isLoading && !error && (!conversations || conversations.length === 0) && (
        <div className="empty-state">No conversations found</div>
      )}

      {!isLoading && !error && conversations && conversations.length > 0 && (
        <div className="list-scroll">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedId === conv.id ? 'active' : ''}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="avatar">
                {conv.fan.avatar ? (
                  <img src={conv.fan.avatar} alt={conv.fan.name} />
                ) : (
                  <div className="avatar-initials">{getInitials(conv.fan.name)}</div>
                )}
                {conv.fan.isOnline && <div className="online-indicator" />}
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <span className="fan-name">{conv.fan.name}</span>
                  {conv.lastMessage && (
                    <span className="timestamp">
                      {formatDistanceToNow(new Date(conv.lastMessage.sentAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <div className="last-message">{truncate(conv.lastMessage.body, 80)}</div>
                )}
                {conv.unreadCount > 0 && (
                  <div className="unread-badge">{conv.unreadCount}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
