import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface SearchResult {
  id: string;
  type: 'command' | 'blog' | 'topic' | 'page';
  name?: string;
  title?: string;
  description?: string;
  module?: string;
  group?: string;
  complexity?: string;
  keywords?: string[];
  url: string;
  filename?: string;
}

interface SearchIndexData {
  version: string;
  generated: string;
  commands: Array<{
    id: string;
    type: string;
    name: string;
    title: string;
    description: string;
    module: string;
    group: string;
    complexity: string;
    keywords: string[];
    url: string;
  }>;
  blogs: Array<{
    id: string;
    type: string;
    filename: string;
    url: string;
  }>;
  topics: Array<{
    id: string;
    type: string;
    filename: string;
    url: string;
  }>;
  pages: Array<{
    id: string;
    type: string;
    title: string;
    url: string;
  }>;
}

interface GlobalSearchExplorerProps {
  initialData?: SearchIndexData;
}

export const GlobalSearchExplorer: React.FC<GlobalSearchExplorerProps> = ({
  initialData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<
    'all' | 'command' | 'blog' | 'topic' | 'page'
  >('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Combine all searchable data
  const allResults: SearchResult[] = useMemo(() => {
    if (!initialData) return [];

    const combined: SearchResult[] = [];

    // Add commands
    initialData.commands?.forEach(cmd => {
      combined.push({
        id: cmd.id,
        type: 'command',
        name: cmd.name,
        title: cmd.title,
        description: cmd.description,
        module: cmd.module,
        group: cmd.group,
        complexity: cmd.complexity,
        keywords: cmd.keywords,
        url: cmd.url,
      });
    });

    // Add blog posts
    initialData.blogs?.forEach(blog => {
      combined.push({
        id: blog.id,
        type: 'blog',
        title: blog.filename
          .replace(/\d{4}-\d{2}-\d{2}-/, '')
          .replace(/\.md$|\.mdx$/, '')
          .replace(/-/g, ' ')
          .toUpperCase(),
        description: '',
        url: blog.url,
        filename: blog.filename,
      });
    });

    // Add topics
    initialData.topics?.forEach(topic => {
      combined.push({
        id: topic.id,
        type: 'topic',
        title: topic.filename
          .replace(/\.md$|\.mdx$/, '')
          .replace(/-/g, ' ')
          .toUpperCase(),
        description: '',
        url: topic.url,
        filename: topic.filename,
      });
    });

    // Add pages
    initialData.pages?.forEach(page => {
      combined.push({
        id: page.id,
        type: 'page',
        title: page.title,
        description: '',
        url: page.url,
      });
    });

    return combined;
  }, [initialData]);

  // Filter and search results
  const filteredResults = useMemo(() => {
    let results = allResults;

    // Type filter
    if (selectedType !== 'all') {
      results = results.filter(r => r.type === selectedType);
    }

    // Complexity filter (commands only)
    if (selectedComplexity !== 'all' && selectedType === 'command') {
      results = results.filter(r => r.complexity === selectedComplexity);
    }

    // Group filter (commands only)
    if (selectedGroup !== 'all' && selectedType === 'command') {
      results = results.filter(r => r.group === selectedGroup);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(r => {
        const title = (r.title || '').toLowerCase();
        const description = (r.description || '').toLowerCase();
        const keywords = (r.keywords || []).map(k => k.toLowerCase()).join(' ');
        const name = (r.name || '').toLowerCase();

        return (
          title.includes(query) ||
          description.includes(query) ||
          keywords.includes(query) ||
          name.includes(query)
        );
      });
    }

    return results;
  }, [allResults, searchQuery, selectedType, selectedComplexity, selectedGroup]);

  // Get unique values for filters
  const complexityOptions = useMemo(
    () =>
      Array.from(new Set(allResults
        .filter(r => r.type === 'command')
        .map(r => r.complexity)
        .filter(Boolean) as string[]))
        .sort(),
    [allResults]
  );

  const groupOptions = useMemo(
    () =>
      Array.from(new Set(allResults
        .filter(r => r.type === 'command')
        .map(r => r.group)
        .filter(Boolean) as string[]))
        .sort(),
    [allResults]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            Math.min(prev + 1, filteredResults.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredResults[highlightedIndex]) {
            window.location.href = filteredResults[highlightedIndex].url;
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSearchQuery('');
          break;
        default:
          break;
      }
    },
    [highlightedIndex, filteredResults]
  );

  // Scroll highlighted result into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const highlightedElement = resultsContainerRef.current.querySelector(
        '[data-highlighted="true"]'
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      command: '⚡',
      blog: '📰',
      topic: '📚',
      page: '📄',
    };
    return icons[type] || '📍';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      command: 'Command',
      blog: 'Blog',
      topic: 'Topic',
      page: 'Page',
    };
    return labels[type] || type;
  };

  return (
    <div className="global-search-explorer" style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔍 Search Everything from Everywhere</h1>
        <p style={styles.subtitle}>
          Instantly find commands, documentation topics, blog posts, and resources
        </p>
      </div>

      <div style={styles.searchSection}>
        {/* Search Input */}
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search commands, topics, blogs... (Try: GET, SET, cluster, replication)"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          style={styles.searchInput}
          autoFocus
        />

        {/* Filters */}
        <div style={styles.filtersGrid}>
          <select
            value={selectedType}
            onChange={e => {
              setSelectedType(
                e.target.value as
                  | 'all'
                  | 'command'
                  | 'blog'
                  | 'topic'
                  | 'page'
              );
              setHighlightedIndex(0);
            }}
            style={styles.select}
          >
            <option value="all">📋 All Types</option>
            <option value="command">⚡ Commands</option>
            <option value="blog">📰 Blog Posts</option>
            <option value="topic">📚 Topics</option>
            <option value="page">📄 Pages</option>
          </select>

          {selectedType === 'command' && complexityOptions.length > 0 && (
            <select
              value={selectedComplexity}
              onChange={e => {
                setSelectedComplexity(e.target.value);
                setHighlightedIndex(0);
              }}
              style={styles.select}
            >
              <option value="all">📊 Any Complexity</option>
              {complexityOptions.map(complexity => (
                <option key={complexity} value={complexity}>
                  {complexity}
                </option>
              ))}
            </select>
          )}

          {selectedType === 'command' && groupOptions.length > 0 && (
            <select
              value={selectedGroup}
              onChange={e => {
                setSelectedGroup(e.target.value);
                setHighlightedIndex(0);
              }}
              style={styles.select}
            >
              <option value="all">🏷️ Any Group</option>
              {groupOptions.map(group => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Results Counter */}
      <div style={styles.resultsMeta}>
        <span style={styles.resultCount}>
          {filteredResults.length > 0
            ? `Found ${filteredResults.length} result${filteredResults.length !== 1 ? 's' : ''}`
            : searchQuery
              ? 'No results found'
              : 'Start typing to search'}
        </span>
      </div>

      {/* Results List */}
      <div style={styles.resultsContainer} ref={resultsContainerRef}>
        {filteredResults.length > 0 ? (
          <ul style={styles.resultsList}>
            {filteredResults.map((result, index) => (
              <li
                key={result.id}
                data-highlighted={index === highlightedIndex}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  window.location.href = result.url;
                }}
                style={{
                  ...styles.resultItem,
                  ...(index === highlightedIndex && styles.resultItemHighlighted),
                }}
              >
                <div style={styles.resultIcon}>{getTypeIcon(result.type)}</div>

                <div style={styles.resultContent}>
                  <div style={styles.resultTitle}>
                    {result.title || result.name}
                  </div>

                  <div style={styles.resultDescription}>
                    {result.description?.substring(0, 100)}
                    {result.description && result.description.length > 100
                      ? '...'
                      : ''}
                  </div>

                  <div style={styles.resultMeta}>
                    <span style={styles.resultType}>
                      {getTypeLabel(result.type)}
                    </span>
                    {result.module && (
                      <span style={styles.resultModule}>{result.module}</span>
                    )}
                    {result.group && (
                      <span style={styles.resultGroup}>{result.group}</span>
                    )}
                    {result.complexity && (
                      <span style={styles.resultComplexity}>
                        {result.complexity}
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.resultArrow}>→</div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>
              {searchQuery
                ? `No results for "${searchQuery}". Try different keywords!`
                : 'Search across all Valkey documentation and resources'}
            </p>
          </div>
        )}
      </div>

      {/* Keyboard Hints */}
      <div style={styles.keyboardHints}>
        <span style={styles.keyboardHint}>↑ ↓ Navigate</span>
        <span style={styles.keyboardHint}>⏎ Open</span>
        <span style={styles.keyboardHint}>Esc Clear</span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,

  header: {
    marginBottom: '2rem',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 0.5rem 0',
  } as React.CSSProperties,

  subtitle: {
    fontSize: '1rem',
    color: '#666',
    margin: 0,
  } as React.CSSProperties,

  searchSection: {
    marginBottom: '2rem',
  } as React.CSSProperties,

  searchInput: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    border: '2px solid #ddd',
    borderRadius: '6px',
    marginBottom: '1rem',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
  } as React.CSSProperties,

  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
  } as React.CSSProperties,

  select: {
    padding: '0.75rem',
    fontSize: '0.9rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,

  resultsMeta: {
    marginBottom: '1rem',
    fontSize: '0.9rem',
    color: '#666',
  } as React.CSSProperties,

  resultCount: {
    fontWeight: 'bold',
  } as React.CSSProperties,

  resultsContainer: {
    marginBottom: '2rem',
    maxHeight: '600px',
    overflowY: 'auto' as const,
  } as React.CSSProperties,

  resultsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  } as React.CSSProperties,

  resultItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    marginBottom: '0.5rem',
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,

  resultItemHighlighted: {
    backgroundColor: '#f0f7ff',
    borderColor: '#2563eb',
    boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.1)',
  } as React.CSSProperties,

  resultIcon: {
    fontSize: '1.5rem',
    marginRight: '1rem',
    flexShrink: 0,
  } as React.CSSProperties,

  resultContent: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  resultTitle: {
    fontWeight: 'bold',
    fontSize: '1rem',
    color: '#1a1a1a',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  resultDescription: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '0.5rem',
    maxHeight: '2.4em',
    overflow: 'hidden',
  } as React.CSSProperties,

  resultMeta: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    fontSize: '0.8rem',
  } as React.CSSProperties,

  resultType: {
    backgroundColor: '#f0f0f0',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontWeight: '500',
  } as React.CSSProperties,

  resultModule: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontWeight: '500',
  } as React.CSSProperties,

  resultGroup: {
    backgroundColor: '#fce7f3',
    color: '#be185d',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontWeight: '500',
  } as React.CSSProperties,

  resultComplexity: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontWeight: '500',
  } as React.CSSProperties,

  resultArrow: {
    marginLeft: '1rem',
    fontSize: '1.25rem',
    color: '#999',
    flexShrink: 0,
  } as React.CSSProperties,

  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px dashed #ddd',
  } as React.CSSProperties,

  emptyStateText: {
    color: '#999',
    fontSize: '1rem',
    margin: 0,
  } as React.CSSProperties,

  keyboardHints: {
    display: 'flex',
    gap: '1.5rem',
    justifyContent: 'center',
    fontSize: '0.85rem',
    color: '#999',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  } as React.CSSProperties,

  keyboardHint: {
    fontFamily: 'monospace',
  } as React.CSSProperties,
};

export default GlobalSearchExplorer;
