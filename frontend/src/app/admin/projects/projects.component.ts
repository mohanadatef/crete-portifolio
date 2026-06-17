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
  status: 'loading' | 'success' | 'error' = 'loading';
  showModal = false;
  
  formData: any = {
    title_ar: '',
    title_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    location: '',
    status: 1,
    featured: 0
  };
  
  selectedFiles: File[] = [];

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.http.get<any[]>('http://127.0.0.1:8000/api/admin/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (data) => {
        this.projects = data;
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }

  onFileSelect(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  saveProject() {
    const data = new FormData();
    Object.keys(this.formData).forEach(key => {
      data.append(key, this.formData[key]);
    });

    // Append multiple files
    this.selectedFiles.forEach(file => {
      data.append('images[]', file, file.name);
    });

    this.http.post('http://127.0.0.1:8000/api/admin/projects', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: () => {
        this.showModal = false;
        this.loadProjects();
      },
      error: (err) => alert('Error saving project')
    });
  }
}
