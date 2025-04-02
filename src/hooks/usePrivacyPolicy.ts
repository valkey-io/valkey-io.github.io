import { useEffect, useState } from 'react';

export const usePrivacyPolicy = () => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/content/privacy-policy.md');
        if (!response.ok) {
          throw new Error('Failed to fetch Privacy Policy content');
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