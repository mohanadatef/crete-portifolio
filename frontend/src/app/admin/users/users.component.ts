import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../services/user.service';
import { RoleService, Role } from '../../services/role.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold">Users Management</h1>
        <button (click)="openForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Add User</button>
      </div>

      <!-- Filters -->
      <div class="flex space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div class="flex-1">
          <input type="text" [(ngModel)]="search" (ngModelChange)="onFilterChange()" placeholder="Search by name or email..." class="w-full border rounded p-2" />
        </div>
        <div class="w-64">
          <select [(ngModel)]="selectedRole" (ngModelChange)="onFilterChange()" class="w-full border rounded p-2">
            <option value="">All Roles</option>
            <option *ngFor="let role of availableRoles" [value]="role.name">{{ role.name }}</option>
          </select>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="p-4 font-semibold text-gray-600">Name</th>
              <th class="p-4 font-semibold text-gray-600">Email</th>
              <th class="p-4 font-semibold text-gray-600">Roles</th>
              <th class="p-4 font-semibold text-gray-600">Status</th>
              <th class="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="users.length === 0">
              <td colspan="5" class="p-4 text-center text-gray-500">No users found</td>
            </tr>
            <tr *ngFor="let user of users" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="p-4">{{ user.name }}</td>
              <td class="p-4">{{ user.email }}</td>
              <td class="p-4">
                <span *ngFor="let role of user.roles" class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                  {{ role.name }}
                </span>
              </td>
              <td class="p-4">
                <span [class]="user.is_active ? 'text-green-600 bg-green-50 px-2 py-1 rounded text-sm' : 'text-red-600 bg-red-50 px-2 py-1 rounded text-sm'">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="p-4 space-x-2">
                <button (click)="editUser(user)" class="text-blue-600 hover:text-blue-800">Edit</button>
                <button (click)="deleteUser(user.id)" class="text-red-600 hover:text-red-800">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination Controls -->
        <div class="flex items-center justify-between p-4 border-t border-gray-100" *ngIf="meta">
          <div class="text-sm text-gray-500">
            Showing {{ meta.from || 0 }} to {{ meta.to || 0 }} of {{ meta.total }} results
          </div>
          <div class="flex space-x-2">
            <button 
              [disabled]="page === 1" 
              (click)="changePage(page - 1)" 
              class="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50">
              Previous
            </button>
            <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded">
              Page {{ page }} of {{ meta.last_page }}
            </span>
            <button 
              [disabled]="page >= meta.last_page" 
              (click)="changePage(page + 1)" 
              class="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- User Form Modal -->
      <div *ngIf="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-xl w-[500px] max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-4">{{ selectedUser ? 'Edit User' : 'Add User' }}</h2>
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Name</label>
              <input type="text" formControlName="name" class="w-full border rounded p-2" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Email</label>
              <input type="email" formControlName="email" class="w-full border rounded p-2" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Password <span *ngIf="selectedUser" class="text-gray-400 font-normal">(leave empty to keep current)</span></label>
              <input type="password" formControlName="password" class="w-full border rounded p-2" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Roles</label>
              <select formControlName="roles" multiple class="w-full border rounded p-2 h-32">
                <option *ngFor="let role of availableRoles" [value]="role.name">{{ role.name }}</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Command (Mac) to select multiple</p>
            </div>
            <div class="mb-4 flex items-center">
              <input type="checkbox" formControlName="is_active" id="isActive" class="mr-2 h-4 w-4 text-blue-600 rounded" />
              <label for="isActive" class="text-sm font-medium">Account is Active</label>
            </div>
            <div class="flex justify-end space-x-2 mt-6">
              <button type="button" (click)="closeForm()" class="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" [disabled]="userForm.invalid" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  meta: any = null;
  availableRoles: Role[] = [];
  
  // Filters and Pagination
  page = 1;
  perPage = 10;
  search = '';
  selectedRole = '';
  filterTimeout: any;

  // Form
  showForm = false;
  selectedUser: User | null = null;
  userForm: FormGroup;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      roles: [[]],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers() {
    this.userService.getUsers(this.page, this.perPage, this.search, this.selectedRole).subscribe((res: any) => {
      this.users = res.data?.data ? res.data.data : (res.data || []);
      this.meta = res.data?.meta ? res.data.meta : null;
    });
  }

  loadRoles() {
    this.roleService.getRoles().subscribe((res: any) => {
      this.availableRoles = res.data;
    });
  }

  onFilterChange() {
    // Debounce search input
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.filterTimeout = setTimeout(() => {
      this.page = 1; // Reset to first page on filter
      this.loadUsers();
    }, 500);
  }

  changePage(newPage: number) {
    if (newPage >= 1 && (!this.meta || newPage <= this.meta.last_page)) {
      this.page = newPage;
      this.loadUsers();
    }
  }

  openForm() {
    this.selectedUser = null;
    this.userForm.reset({ roles: [], is_active: true });
    // Password is required for new users
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
  }

  editUser(user: User) {
    this.selectedUser = user;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      password: '',
      roles: user.roles?.map((r: any) => r.name) || [],
      is_active: user.is_active
    });
    // Password is optional for editing
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert(err.error?.message || 'Error deleting user')
      });
    }
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    const val = this.userForm.value;
    if (this.selectedUser) {
      if (!val.password) delete val.password;
      this.userService.updateUser(this.selectedUser.id, val).subscribe({
        next: () => {
          this.loadUsers();
          this.closeForm();
        },
        error: (err) => alert(err.error?.message || 'Error updating user')
      });
    } else {
      this.userService.createUser(val).subscribe({
        next: () => {
          this.loadUsers();
          this.closeForm();
        },
        error: (err) => alert(err.error?.message || 'Error creating user')
      });
    }
  }
}
