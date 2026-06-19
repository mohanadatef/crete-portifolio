import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { ProjectTypeService } from '../../core/services/project-type.service';
import { Project, ProjectType } from '../../core/models/models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private projectTypeService = inject(ProjectTypeService);
  private fb = inject(FormBuilder);
  projects = signal<Project[]>([]);
  projectTypes = signal<ProjectType[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');
  showModal = signal(false);
  
  projectForm: FormGroup;
  selectedFiles: File[] = [];

  filters = {
    search: '',
    project_type_id: '',
    status: ''
  };

  constructor() {
    this.projectForm = this.fb.group({
      title_ar: ['', Validators.required],
      title_en: ['', Validators.required],
      slug: ['', Validators.required],
      description_ar: [''],
      description_en: [''],
      location: [''],
      project_type_id: ['', Validators.required],
      status: [true],
      featured: [false],
      price: [null],
      area: [null],
      bedrooms: [null],
      developer: [''],
      delivery_date: [null]
    });
  }

  ngOnInit() {
    this.loadProjectTypes();
    this.loadProjects();
  }

  loadProjectTypes() {
    this.projectTypeService.getAll().subscribe({
      next: (res) => {
        this.projectTypes.set(res.data.data || []);
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

  onFileSelect(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  openModal(project?: Project) {
    if (project) {
      this.projectForm.patchValue({
        ...project,
        status: !!project.status,
        featured: !!project.featured
      });
    } else {
      this.projectForm.reset({
        status: true,
        featured: false
      });
    }
    this.selectedFiles = [];
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveProject() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const data = new FormData();
    const formValues = this.projectForm.value;

    Object.keys(formValues).forEach(key => {
      let value = formValues[key];
      if (value !== null && value !== undefined) {
        if (key === 'status' || key === 'featured') {
          value = value ? '1' : '0';
        }
        data.append(key, value);
      }
    });

    this.selectedFiles.forEach(file => {
      data.append('images[]', file, file.name);
    });

    this.projectService.create(data as any).subscribe({
      next: () => {
        this.closeModal();
        this.loadProjects();
      },
      error: (err) => {
        console.error(err);
        alert('Error saving project. Please check the inputs.');
      }
    });
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
