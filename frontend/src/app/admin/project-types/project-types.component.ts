import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-project-types',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './project-types.component.html',
  styleUrl: './project-types.component.scss'
})
export class ProjectTypesComponent implements OnInit {
  private http = inject(HttpClient);
  projectTypes: any[] = [];
  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  // Toasts
  toasts = signal<{id: number, message: string, type: 'success' | 'error'}[]>([]);
  toastIdCounter = 0;

  showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = ++this.toastIdCounter;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => {
      this.toasts.update(t => t.filter(toast => toast.id !== id));
    }, 4000);
  }
  
  formData: any = {
    name_ar: '',
    name_en: '',
    is_active: true
  };

  // Filters
  filters = {
    search: '',
    status: ''
  };

  // Pagination
  currentPage = 1;
  lastPage = 1;
  perPage = 10;
  totalRecords = 0;

  searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((searchValue) => {
      this.filters.search = searchValue;
      this.loadProjectTypes(1);
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  ngOnInit() {
    this.loadProjectTypes();
  }

  loadProjectTypes(page: number = 1) {
    const headers = { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` };
    let params = new URLSearchParams();
    if (this.filters.search) params.append('search', this.filters.search);
    if (this.filters.status) params.append('status', this.filters.status);
    params.append('page', page.toString());
    params.append('per_page', this.perPage.toString());

    this.http.get<any>(`${environment.apiUrl}/admin/project-types?${params.toString()}`, { headers }).subscribe({
      next: (res) => {
        const paginatedData = res.data || {};
        this.projectTypes = paginatedData.data || [];
        this.currentPage = paginatedData.meta?.current_page || paginatedData.current_page || 1;
        this.lastPage = paginatedData.meta?.last_page || paginatedData.last_page || 1;
        this.totalRecords = paginatedData.meta?.total || paginatedData.total || this.projectTypes.length;
      },
      error: (err) => {
        console.error('Error loading project types', err);
        this.showToast('Error loading project types', 'error');
      }
    });
  }

  applyFilters() {
    this.loadProjectTypes(1);
  }

  resetFilters() {
    this.filters = { search: '', status: '' };
    this.loadProjectTypes(1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.loadProjectTypes(page);
    }
  }

  changePerPage(event: any) {
    this.perPage = parseInt(event.target.value, 10);
    this.loadProjectTypes(1);
  }

  openModal() {
    this.isEditing = false;
    this.editingId = null;
    this.formData = {
      name_ar: '',
      name_en: '',
      is_active: true
    };
    this.showModal = true;
  }

  editType(type: any) {
    this.isEditing = true;
    this.editingId = type.id;
    this.formData = {
      name_ar: type.name_ar,
      name_en: type.name_en,
      is_active: type.is_active
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveType() {
    const headers = { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` };
    const payload = {
      ...this.formData,
      is_active: this.formData.is_active ? 1 : 0
    };

    if (this.isEditing && this.editingId) {
      this.http.put(`${environment.apiUrl}/admin/project-types/${this.editingId}`, payload, { headers }).subscribe({
        next: () => {
          this.closeModal();
          this.loadProjectTypes(this.currentPage);
          this.showToast('Project Type updated successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error updating project type';
          this.showToast(msg, 'error');
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/admin/project-types`, payload, { headers }).subscribe({
        next: () => {
          this.closeModal();
          this.loadProjectTypes(1);
          this.showToast('Project Type created successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error creating project type';
          this.showToast(msg, 'error');
        }
      });
    }
  }

  deleteType(id: number) {
    if (confirm('Are you sure you want to delete this project type?')) {
      this.http.delete(`${environment.apiUrl}/admin/project-types/${id}`, {
        headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` }
      }).subscribe({
        next: () => {
          this.loadProjectTypes(this.currentPage);
          this.showToast('Project Type deleted successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error deleting project type';
          this.showToast(msg, 'error');
        }
      });
    }
  }
}
