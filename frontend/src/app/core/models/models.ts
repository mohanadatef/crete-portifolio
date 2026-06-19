export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
  users_count?: number;
}

export interface Permission {
  id: number;
  name: string;
}

export interface ProjectType {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  status: boolean;
}

export interface Project {
  id: number;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  location?: string;
  status: boolean;
  featured: boolean;
  price?: number;
  area?: number;
  bedrooms?: number;
  delivery_date?: string;
  developer?: string;
  project_type_id?: number;
  project_type?: ProjectType;
  images?: ProjectImage[];
}

export interface ProjectImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  message?: string;
  source?: string;
  project_id?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  created_at?: string;
}

export interface BlogCategory {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  status: boolean;
}

export interface BlogPost {
  id: number;
  slug: string;
  title_ar: string;
  title_en: string;
  content_ar?: string;
  content_en?: string;
  image?: string;
  status: boolean;
  blog_category_id?: number;
  blog_category?: BlogCategory;
}

export interface Page {
  id: number;
  slug: string;
  title_ar: string;
  title_en: string;
  content_ar?: string;
  content_en?: string;
  status: boolean;
}

export interface LandingPage {
  id: number;
  slug: string;
  title_ar: string;
  title_en: string;
  content_ar?: string;
  content_en?: string;
  status: boolean;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
}
