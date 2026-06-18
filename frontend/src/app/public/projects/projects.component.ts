import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, TranslateDirective],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private http = inject(HttpClient);
  public translate = inject(TranslateService);
  
  projects: any[] = [];
  projectTypes: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';
  
  filters = {
    project_type_id: '',
    location: '',
    min_price: null,
    max_price: null,
    bedrooms: null
  };

  ngOnInit() {
    this.loadProjectTypes();
    this.loadProjects();
  }

  loadProjectTypes() {
    this.http.get<any>('http://backend.test/api/v1/public/project-types').subscribe({
      next: (res) => {
        this.projectTypes = res.data || [];
      },
      error: (err) => console.error('Error loading project types', err)
    });
  }

  loadProjects() {
    this.status = 'loading';
    let params: any = {};
    if (this.filters.project_type_id) params.project_type_id = this.filters.project_type_id;
    if (this.filters.location) params.location = this.filters.location;
    if (this.filters.min_price) params.min_price = this.filters.min_price;
    if (this.filters.max_price) params.max_price = this.filters.max_price;
    if (this.filters.bedrooms) params.bedrooms = this.filters.bedrooms;

    this.http.get<any>('http://backend.test/api/v1/public/projects', { params }).subscribe({
      next: (res) => {
        const paginatedData = res.data || {};
        const projectsArray = paginatedData.data || res || [];
        this.projects = Array.isArray(projectsArray) ? projectsArray : [];
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }

  applyFilters() {
    this.loadProjects();
  }
}
