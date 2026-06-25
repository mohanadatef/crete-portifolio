import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { AuthService } from '../../services/auth.service';
import { User, Role } from '../../core/models/models';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HasPermissionDirective],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private dataService = inject(UserService);
  private roleService = inject(RoleService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  availableRoles = signal<Role[]>([]);

  status = signal<'loading' | 'success' | 'error'>('loading');
  
  showModal = signal(false);
  showPasswordModal = signal(false);
  deleteId = signal<number | null>(null);
  
  currentUserId = signal<number | null>(null);

  dataForm: FormGroup;
  passwordForm: FormGroup;

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
      password_confirmation: [''],
      roles: [''], // Single string
      is_active: [true], // Default true for new users
    });

    this.passwordForm = this.fb.group({
      id: [null, Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', Validators.required]
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
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId.set(user.id);
    }
    
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
        const paginatedData = response.data as any;
        this.users.set(paginatedData.data || paginatedData || []);
        if (paginatedData.current_page || paginatedData.meta?.current_page) {
          this.pagination.set({
            current_page: paginatedData.meta?.current_page || paginatedData.current_page,
            last_page: paginatedData.meta?.last_page || paginatedData.last_page,
            per_page: paginatedData.meta?.per_page || paginatedData.per_page,
            total: paginatedData.meta?.total || paginatedData.total
          });
        }
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  openModal(item?: User) {
    Object.keys(this.dataForm.controls).forEach(key => {
      this.dataForm.get(key)?.setErrors(null);
    });

    if (item) {
      const userRole = item.roles && item.roles.length > 0 
          ? (typeof item.roles[0] === 'string' ? item.roles[0] : item.roles[0].name) 
          : '';
      
      this.dataForm.patchValue({
        id: item.id,
        name: item.name,
        email: item.email,
        roles: userRole,
        password: '',
        password_confirmation: ''
      });
    } else {
      this.dataForm.reset({
        is_active: true,
        roles: '',
        password: '',
        password_confirmation: ''
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  openPasswordModal(item: User) {
    Object.keys(this.passwordForm.controls).forEach(key => {
      this.passwordForm.get(key)?.setErrors(null);
    });

    this.passwordForm.reset({
      id: item.id,
      password: '',
      password_confirmation: ''
    });
    this.showPasswordModal.set(true);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
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

  toggleStatus(item: User) {
    if (item.id === this.currentUserId()) {
       this.showToast('You cannot change your own status', 'error');
       return;
    }
    const newStatus = !item.is_active;
    this.dataService.update(item.id, { is_active: newStatus }).subscribe({
      next: () => {
        item.is_active = newStatus;
        this.showToast(`User status updated successfully`, 'success');
      },
      error: (err) => {
        const errMsg = err.error?.message || 'Error updating status';
        this.showToast(errMsg, 'error');
      }
    });
  }

  handleServerValidationErrors(err: any, form: FormGroup) {
    if (err.error && err.error.errors) {
      const serverErrors = err.error.errors;
      Object.keys(serverErrors).forEach(field => {
        const control = form.get(field);
        if (control) {
          control.setErrors({ serverError: serverErrors[field][0] });
          control.markAsTouched();
        } else {
          this.showToast(serverErrors[field][0], 'error');
        }
      });
    } else {
      const msg = err.error?.message || 'Error saving data.';
      this.showToast(msg, 'error');
    }
  }

  saveData() {
    const isEdit = !!this.dataForm.get('id')?.value;
    
    if (!isEdit) {
      const p = this.dataForm.get('password')?.value;
      const pc = this.dataForm.get('password_confirmation')?.value;
      if (!p) {
        this.dataForm.get('password')?.setErrors({ required: true });
        this.dataForm.markAllAsTouched();
        return;
      }
      if (p !== pc) {
        this.dataForm.get('password_confirmation')?.setErrors({ notSame: true });
        this.dataForm.markAllAsTouched();
        return;
      }
    }

    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      return;
    }

    const formValues = this.dataForm.value;
    const data: any = {};
    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== null && formValues[key] !== undefined && formValues[key] !== '') {
        if (key === 'roles') {
           data[key] = [formValues[key]];
        } else {
           data[key] = formValues[key];
        }
      } else if (key === 'roles') {
        data[key] = [];
      }
    });

    if (isEdit) {
        delete data.password;
        delete data.password_confirmation;
        delete data.is_active;

        this.dataService.update(data.id, data).subscribe({
          next: () => {
            this.closeModal();
            this.loadData();
            this.showToast('User updated successfully', 'success');
          },
          error: (err) => this.handleServerValidationErrors(err, this.dataForm)
        });
    } else {
        data.is_active = true; 
        this.dataService.create(data).subscribe({
          next: () => {
            this.closeModal();
            this.loadData();
            this.showToast('User created successfully', 'success');
          },
          error: (err) => this.handleServerValidationErrors(err, this.dataForm)
        });
    }
  }

  savePassword() {
    const p = this.passwordForm.get('password')?.value;
    const pc = this.passwordForm.get('password_confirmation')?.value;
    if (p !== pc) {
      this.passwordForm.get('password_confirmation')?.setErrors({ notSame: true });
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const id = this.passwordForm.get('id')?.value;
    const data = {
      password: p,
      password_confirmation: pc
    };

    this.dataService.update(id, data).subscribe({
      next: () => {
        this.closePasswordModal();
        this.showToast('Password updated successfully', 'success');
      },
      error: (err) => this.handleServerValidationErrors(err, this.passwordForm)
    });
  }
}
