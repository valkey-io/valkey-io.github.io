export interface Author {
  name: string;
  username: string;
  bio: string;
  imageUrl: string;
  role: string;
  githubUser?: string;
}

export interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
  content: string;
  slug: string;
  category: 'tutorials' | 'news' | 'case-studies';
  imageUrl: string;
  authors: Author[];
  trending?: boolean;
}

export interface Category {
  value: string;
  label: string;
  description: string;
}

export interface CommandCategory {
  id: string;
  topicName: string;
  description: string;
  htmlContent: string;
}

export interface TopicCategory {
  title: string;
  items: CommandCategory[];
} 