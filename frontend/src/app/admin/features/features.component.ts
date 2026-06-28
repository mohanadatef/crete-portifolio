import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { FeatureService } from '../../core/services/feature.service';
import { Feature } from '../../core/models/models';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent implements OnInit {
  private featureService = inject(FeatureService);
  features: Feature[] = [];
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
      this.loadFeatures(1);
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  ngOnInit() {
    this.loadFeatures();
  }

  loadFeatures(page: number = 1) {
    const params: any = {
      page: page.toString(),
      per_page: this.perPage.toString()
    };
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.status) params.status = this.filters.status;

    this.featureService.getAll(params).subscribe({
      next: (res) => {
        const paginatedData = res.data || {};
        this.features = paginatedData.data || [];
        this.currentPage = paginatedData.current_page || 1;
        this.lastPage = paginatedData.last_page || 1;
        this.totalRecords = paginatedData.total || this.features.length;
      },
      error: (err) => {
        console.error('Error loading project features', err);
        this.showToast('Error loading project features', 'error');
      }
    });
  }

  applyFilters() {
    this.loadFeatures(1);
  }

  resetFilters() {
    this.filters = { search: '', status: '' };
    this.loadFeatures(1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.loadFeatures(page);
    }
  }

  changePerPage(event: any) {
    this.perPage = parseInt(event.target.value, 10);
    this.loadFeatures(1);
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

  editFeature(feat: Feature) {
    this.isEditing = true;
    this.editingId = feat.id;
    this.formData = {
      name_ar: feat.name_ar,
      name_en: feat.name_en,
      is_active: feat.is_active
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveFeature() {
    const payload = {
      ...this.formData,
      is_active: this.formData.is_active ? 1 : 0
    };

    if (this.isEditing && this.editingId) {
      this.featureService.update(this.editingId, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadFeatures(this.currentPage);
          this.showToast('Project Feature updated successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error updating project feature';
          this.showToast(msg, 'error');
        }
      });
    } else {
      this.featureService.create(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadFeatures(1);
          this.showToast('Project Feature created successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error creating project feature';
          this.showToast(msg, 'error');
        }
      });
    }
  }

  deleteFeature(id: number) {
    if (confirm('Are you sure you want to delete this project feature?')) {
      this.featureService.delete(id).subscribe({
        next: () => {
          this.loadFeatures(this.currentPage);
          this.showToast('Project Feature deleted successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error deleting project feature';
          this.showToast(msg, 'error');
        }
      });
    }
  }
}
