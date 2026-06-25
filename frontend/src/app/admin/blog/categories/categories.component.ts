import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogCategoryService } from '../../../core/services/blog-category.service';
import { BlogCategory } from '../../../core/models/models';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './categories.component.html'
})
export class CategoriesComponent implements OnInit {
  private dataService = inject(BlogCategoryService);

  categories = signal<BlogCategory[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');
  showModal = signal(false);
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

  formData = {
    name_ar: '',
    name_en: '',
    status: true
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

  ngOnInit() {
    this.loadData();
  }

  loadData(page: number = 1) {
    this.status.set('loading');
    const params = {
      search: this.filters.search,
      status: this.filters.status,
      page: page,
      per_page: this.perPage
    };

    this.dataService.getAll(params).subscribe({
      next: (response: any) => {
        const paginatedData = response.data || {};
        this.categories.set(paginatedData.data || []);
        this.currentPage = paginatedData.meta?.current_page || paginatedData.current_page || 1;
        this.lastPage = paginatedData.meta?.last_page || paginatedData.last_page || 1;
        this.totalRecords = paginatedData.meta?.total || paginatedData.total || this.categories().length;
        this.status.set('success');
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.status.set('error');
        this.showToast('Error loading categories', 'error');
      }
    });
  }

  applyFilters() {
    this.loadData(1);
  }

  resetFilters() {
    this.filters = { search: '', status: '' };
    this.loadData(1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.loadData(page);
    }
  }

  changePerPage(event: any) {
    this.perPage = parseInt(event.target.value, 10);
    this.loadData(1);
  }

  openModal(item?: BlogCategory) {
    if (item) {
      this.isEditing = true;
      this.editingId = item.id;
      this.formData = {
        name_ar: item.name_ar,
        name_en: item.name_en,
        status: !!item.status
      };
    } else {
      this.isEditing = false;
      this.editingId = null;
      this.formData = {
        name_ar: '',
        name_en: '',
        status: true
      };
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveData() {
    if (!this.formData.name_ar || !this.formData.name_en) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const payload = {
      ...this.formData,
      status: this.formData.status ? 1 : 0
    };

    if (this.isEditing && this.editingId) {
      this.dataService.update(this.editingId, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadData(this.currentPage);
          this.showToast('Category updated successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error updating category';
          this.showToast(msg, 'error');
        }
      });
    } else {
      this.dataService.create(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadData(1);
          this.showToast('Category created successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error creating category';
          this.showToast(msg, 'error');
        }
      });
    }
  }

  deleteData(id: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.dataService.delete(id).subscribe({
        next: () => {
          this.loadData(this.currentPage);
          this.showToast('Category deleted successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error deleting category';
          this.showToast(msg, 'error');
        }
      });
    }
  }
}
