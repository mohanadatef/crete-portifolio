import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private http = inject(HttpClient);
  projects: any[] = [];
  projectTypes: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';
  showModal = false;
  
  formData: any = {
    title_ar: '',
    title_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    location: '',
    project_type_id: '',
    status: true,
    featured: false
  };
  
  selectedFiles: File[] = [];

  filters: any = {
    search: '',
    project_type_id: '',
    status: ''
  };

  ngOnInit() {
    this.loadProjectTypes();
    this.loadProjects();
  }

  loadProjectTypes() {
    this.http.get<any>('http://backend.test/api/v1/admin/project-types/active', {
      headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('token') : null)}` }
    }).subscribe({
      next: (res) => {
        this.projectTypes = res.data || [];
      },
      error: (err) => console.error('Error loading project types', err)
    });
  }

  loadProjects() {
    let params: any = {};
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.project_type_id) params.project_type_id = this.filters.project_type_id;
    if (this.filters.status !== '') params.status = this.filters.status;

    this.http.get<any>('http://backend.test/api/v1/admin/projects', {
        headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('token') : null)}` },
        params: params
    }).subscribe({
      next: (response) => {
        const paginatedData = response.data || {};
        const projectsArray = paginatedData.data || response || [];
        this.projects = Array.isArray(projectsArray) ? projectsArray : [];
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }

  onFileSelect(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  openModal() {
    this.formData = {
      title_ar: '',
      title_en: '',
      slug: '',
      description_ar: '',
      description_en: '',
      location: '',
      project_type_id: '',
      status: true,
      featured: false
    };
    this.selectedFiles = [];
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveProject() {
    const data = new FormData();
    Object.keys(this.formData).forEach(key => {
      let value = this.formData[key];
      if (key === 'status' || key === 'featured') {
        value = value ? '1' : '0';
      }
      data.append(key, value);
    });

    // Append multiple files
    this.selectedFiles.forEach(file => {
      data.append('images[]', file, file.name);
    });

    this.http.post('http://backend.test/api/v1/admin/projects', data, {
        headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('token') : null)}` }
    }).subscribe({
      next: () => {
        this.showModal = false;
        this.loadProjects();
      },
      error: (err) => alert('Error saving project')
    });
  }
}
