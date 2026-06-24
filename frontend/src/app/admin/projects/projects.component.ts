import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../core/services/project.service';
import { ProjectTypeService } from '../../core/services/project-type.service';
import { Project, ProjectType } from '../../core/models/models';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

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

  filters = {
    search: '',
    project_type_id: '',
    status: ''
  };

  ngOnInit() {
    this.loadProjectTypes();
    this.loadProjects();
  }

  loadProjectTypes() {
    this.projectTypeService.getActive().subscribe({
      next: (res) => {
        this.projectTypes.set(res.data || []);
      },
      error: (err) => console.error('Error loading project types', err)
    });
  }

  loadProjects() {
    this.status.set('loading');
    this.projectService.getAll(this.filters).subscribe({
      next: (response) => {
        const paginatedData = response.data;
        this.projects.set(paginatedData.data || []);
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  onFilterChange(event: any, field: string) {
    (this.filters as any)[field] = event.target.value;
    this.loadProjects();
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
