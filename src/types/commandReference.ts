export interface CommandCategory {
  id: string;
  categoryName: string;
  description: string;
}

export interface CommandReference {
  unid: string;
  command: string;
  description: string;
  htmlContent: string;
  categories: string[];
} 