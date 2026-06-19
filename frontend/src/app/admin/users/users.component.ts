import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { User, Role } from '../../core/models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private dataService = inject(UserService);
  private roleService = inject(RoleService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  availableRoles = signal<Role[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');
  showModal = signal(false);
  deleteId = signal<number | null>(null);
  
  dataForm: FormGroup;

  filters = {
    search: '',
    role: '',
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
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      roles: [[]],
      is_active: [true],
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

  ngOnInit() {
    this.loadRoles();
    this.loadData();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onRoleFilterChange(event: Event) {
    this.filters.role = (event.target as HTMLSelectElement).value;
    this.filters.page = 1;
    this.loadData();
  }

  onStatusFilterChange(event: Event) {
    this.filters.status = (event.target as HTMLSelectElement).value;
    this.filters.page = 1;
    this.loadData();
  }

  onPerPageChange(event: Event) {
    this.filters.per_page = Number((event.target as HTMLSelectElement).value);
    this.filters.page = 1;
    this.loadData();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination().last_page) {
      this.filters.page = page;
      this.loadData();
    }
  }

  loadRoles() {
    // Load without pagination
    this.roleService.getAll({ per_page: 1000 }).subscribe({
      next: (res) => {
        const roles = res.data?.data || res.data || [];
        this.availableRoles.set(roles as unknown as Role[]);
      }
    });
  }

  loadData() {
    this.status.set('loading');
    this.dataService.getAll(this.filters).subscribe({
      next: (response) => {
        const paginatedData = response.data;
        this.users.set(paginatedData.data || paginatedData || []);
        if (paginatedData.current_page) {
          this.pagination.set({
            current_page: paginatedData.current_page,
            last_page: paginatedData.last_page,
            per_page: paginatedData.per_page,
            total: paginatedData.total
          });
        }
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  openModal(item?: User) {
    // Clear server errors
    Object.keys(this.dataForm.controls).forEach(key => {
      this.dataForm.get(key)?.setErrors(null);
    });

    if (item) {
      this.dataForm.patchValue({
        ...item,
        is_active: item.is_active !== undefined ? !!item.is_active : true,
        password: '', // empty password on edit
        roles: item.roles ? item.roles.map(r => typeof r === 'string' ? r : r.name) : []
      });
    } else {
      this.dataForm.reset({
        is_active: true,
        roles: []
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

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
          this.showToast('User deleted successfully', 'success');
        },
        error: (err) => {
          const errMsg = err.error?.message || 'Error deleting user';
          this.showToast(errMsg, 'error');
          this.deleteId.set(null);
        }
      });
    }
  }

  handleServerValidationErrors(err: any) {
    if (err.error && err.error.errors) {
      const serverErrors = err.error.errors;
      Object.keys(serverErrors).forEach(field => {
        const control = this.dataForm.get(field);
        if (control) {
          control.setErrors({ serverError: serverErrors[field][0] });
          control.markAsTouched();
        } else {
          // Fallback if field isn't in form
          this.showToast(serverErrors[field][0], 'error');
        }
      });
    } else {
      const msg = err.error?.message || 'Error saving data.';
      this.showToast(msg, 'error');
    }
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
      } else if (key === 'roles') {
        data[key] = [];
      }
    });
    
    // Explicitly pass boolean is_active
    data.is_active = formValues.is_active ? true : false;
    
    if (data.id) {
        this.dataService.update(data.id, data).subscribe({
          next: () => {
            this.closeModal();
            this.loadData();
            this.showToast('User updated successfully', 'success');
          },
          error: (err) => this.handleServerValidationErrors(err)
        });
    } else {
        this.dataService.create(data).subscribe({
          next: () => {
            this.closeModal();
            this.loadData();
            this.showToast('User created successfully', 'success');
          },
          error: (err) => this.handleServerValidationErrors(err)
        });
    }
  }
}
