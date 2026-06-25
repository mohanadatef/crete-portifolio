import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../core/services/project.service';
import { ProjectTypeService } from '../../core/services/project-type.service';
import { Project, ProjectType } from '../../core/models/models';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, RouterModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private projectTypeService = inject(ProjectTypeService);
  private router = inject(Router);
  backendUrl = environment.backendUrl;

  projects = signal<Project[]>([]);
  projectTypes = signal<ProjectType[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');

  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  totalRecords = 0;

  filters = {
    search: '',
    project_type_id: '',
    status: ''
  };

  searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((searchValue) => {
      this.filters.search = searchValue;
      this.loadProjects(1);
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  ngOnInit() {
    this.loadProjectTypes();
    this.loadProjects(1);
  }

  loadProjectTypes() {
    this.projectTypeService.getActive().subscribe({
      next: (res) => {
        this.projectTypes.set(res.data || []);
      },
      error: (err) => console.error('Error loading project types', err)
    });
  }

  loadProjects(page: number = 1) {
    this.status.set('loading');
    const params = {
      ...this.filters,
      page: page,
      per_page: this.perPage
    };
    this.projectService.getAll(params).subscribe({
      next: (response) => {
        const paginatedData = response.data as any;
        this.projects.set(paginatedData.data || []);
        this.currentPage = paginatedData.meta?.current_page || paginatedData.current_page || 1;
        this.lastPage = paginatedData.meta?.last_page || paginatedData.last_page || 1;
        this.totalRecords = paginatedData.meta?.total || paginatedData.total || 0;
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.loadProjects(page);
    }
  }

  changePerPage(event: any) {
    this.perPage = parseInt(event.target.value, 10);
    this.loadProjects(1);
  }

  onFilterChange(event: any, field: string) {
    (this.filters as any)[field] = event.target.value;
    this.loadProjects(1);
  }

  resetFilters() {
    this.filters = {
      search: '',
      project_type_id: '',
      status: ''
    };
    this.loadProjects(1);
  }

  isVideoUrl(url: string): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.mov');
  }

  isImageUrl(url: string): boolean {
    return !this.isVideoUrl(url);
  }

  getPrimaryImage(project: Project): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find(img => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  getImageUrl(path: string | null): string {
    if (!path) return 'assets/images/placeholder.jpg';
    if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
    return this.backendUrl + (path.startsWith('/') ? path : '/' + path);
  }

  deleteProject(id: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.delete(id).subscribe({
        next: () => this.loadProjects(),
        error: () => alert('Error deleting project')
      });
    }
  }
}
