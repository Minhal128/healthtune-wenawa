export interface Template {
  id: number;
  createdAt: string;
  updatedAt: string;
  title: string;
  prompt: string;
  language: string;
}

export interface TemplatesResponse {
  message: string;
  data: Template[];
  page: number;
  total: number;
  lastPage: number;
} 