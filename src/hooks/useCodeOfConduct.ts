import { useEffect, useState } from 'react';

export const useCodeOfConduct = () => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/content/code-of-conduct.md');
        if (!response.ok) {
          throw new Error('Failed to fetch Code of Conduct content');
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return { content, isLoading, error };
}; 