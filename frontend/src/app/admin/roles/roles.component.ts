import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RoleService } from '../../core/services/role.service';
import { Role } from '../../core/models/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
  private dataService = inject(RoleService);
  private fb = inject(FormBuilder);

  roles = signal<Role[]>([]);
  allPermissions = signal<string[]>([]);
  selectedPermissions = signal<string[]>([]);
  
  status = signal<'loading' | 'success' | 'error'>('loading');
  showModal = signal(false);
  
  dataForm: FormGroup;

  filters = {
    search: '',
    status: '',
    page: 1,
    per_page: 10
  };

  pagination = signal({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  searchSubject = new Subject<string>();
  
  toasts = signal<{id: number, message: string, type: 'success' | 'error'}[]>([]);
  toastIdCounter = 0;

  showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = ++this.toastIdCounter;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => {
      this.toasts.update(t => t.filter(toast => toast.id !== id));
    }, 4000);
  }

  constructor() {
    this.dataForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((searchValue) => {
      this.filters.search = searchValue;
      this.filters.page = 1;
      this.loadData();
    });
  }

  onSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }

  ngOnInit() {
    this.loadData();
    this.loadPermissions();
  }

  loadData() {
    this.status.set('loading');
    this.dataService.getAll(this.filters).subscribe({
      next: (response) => {
        const paginatedData: any = response.data;
        this.roles.set(paginatedData.data || []);
        
        if (paginatedData.meta) {
          this.pagination.set({
            current_page: paginatedData.meta.current_page,
            last_page: paginatedData.meta.last_page,
            per_page: paginatedData.meta.per_page,
            total: paginatedData.meta.total
          });
        }
        
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination().last_page) {
      this.filters.page = page;
      this.loadData();
    }
  }

  changePerPage(event: any) {
    this.filters.per_page = parseInt(event.target.value, 10);
    this.filters.page = 1;
    this.loadData();
  }

  loadPermissions() {
    this.dataService.getPermissions().subscribe({
      next: (res) => {
        this.allPermissions.set(res.data || []);
      }
    });
  }

  openModal(item?: Role) {
    if (item) {
      this.dataForm.patchValue({
        id: item.id,
        name: item.name
      });
      // Extract permission names (backend returns array of strings, not objects)
      const perms = item.permissions ? (item.permissions as any as string[]) : [];
      this.selectedPermissions.set([...perms]);
    } else {
      this.dataForm.reset();
      this.selectedPermissions.set([]);
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  togglePermission(perm: string, event: any) {
    const isChecked = event.target.checked;
    let current = [...this.selectedPermissions()];
    if (isChecked) {
      if (!current.includes(perm)) current.push(perm);
    } else {
      current = current.filter(p => p !== perm);
    }
    this.selectedPermissions.set(current);
  }

  hasPermission(perm: string): boolean {
    return this.selectedPermissions().includes(perm);
  }

  saveData() {
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      return;
    }

    const formValues = this.dataForm.value;
    const data: any = {};
    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== null && formValues[key] !== undefined && formValues[key] !== '') {
        data[key] = formValues[key];
      }
    });
    
    // Attach permissions array to payload
    data.permissions = this.selectedPermissions();

    
    if (data.id) {
        this.dataService.update(data.id, data).subscribe({
          next: () => {
            this.closeModal();
            this.loadData();
            this.showToast('Role updated successfully', 'success');
          },
          error: (err) => {
            console.error(err);
            if (err.status === 422 && err.error && err.error.errors) {
              const validationErrors = err.error.errors;
              Object.keys(validationErrors).forEach(key => {
                const control = this.dataForm.get(key);
                if (control) {
                  control.setErrors({ serverError: validationErrors[key][0] });
                }
              });
              this.showToast('Validation error, please check the inputs', 'error');
            } else {
              this.showToast('An unexpected error occurred.', 'error');
            }
          }
        });
    } else {
        this.dataService.create(data).subscribe({
          next: () => {
            this.closeModal();
            this.loadData();
            this.showToast('Role created successfully', 'success');
          },
          error: (err) => {
            console.error(err);
            if (err.status === 422 && err.error && err.error.errors) {
              const validationErrors = err.error.errors;
              Object.keys(validationErrors).forEach(key => {
                const control = this.dataForm.get(key);
                if (control) {
                  control.setErrors({ serverError: validationErrors[key][0] });
                }
              });
              this.showToast('Validation error, please check the inputs', 'error');
            } else {
              this.showToast('An unexpected error occurred.', 'error');
            }
          }
        });
    }
  }

  deleteId = signal<number | null>(null);

  confirmDelete(id: number) {
    this.deleteId.set(id);
  }

  cancelDelete() {
    this.deleteId.set(null);
  }

  executeDelete() {
    const id = this.deleteId();
    if (id) {
      this.dataService.delete(id).subscribe({
        next: () => {
          this.loadData();
          this.deleteId.set(null);
          this.showToast('Item deleted successfully', 'success');
        },
        error: () => {
          this.showToast('Error deleting item', 'error');
          this.deleteId.set(null);
        }
      });
    }
  }
}
