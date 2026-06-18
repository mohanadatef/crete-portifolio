import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../services/user.service';
import { RoleService, Role } from '../../services/role.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold">Users Management</h1>
        <button (click)="openForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Add User</button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="p-4 font-semibold text-gray-600">Name</th>
              <th class="p-4 font-semibold text-gray-600">Email</th>
              <th class="p-4 font-semibold text-gray-600">Roles</th>
              <th class="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="p-4">{{ user.name }}</td>
              <td class="p-4">{{ user.email }}</td>
              <td class="p-4">
                <span *ngFor="let role of user.roles" class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                  {{ role.name }}
                </span>
              </td>
              <td class="p-4 space-x-2">
                <button (click)="editUser(user)" class="text-blue-600 hover:text-blue-800">Edit</button>
                <button (click)="deleteUser(user.id)" class="text-red-600 hover:text-red-800">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- User Form Modal (Simple) -->
      <div *ngIf="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-xl w-[500px]">
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
              <label class="block text-sm font-medium mb-1">Password (leave empty to keep current)</label>
              <input type="password" formControlName="password" class="w-full border rounded p-2" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Roles</label>
              <select formControlName="roles" multiple class="w-full border rounded p-2 h-32">
                <option *ngFor="let role of availableRoles" [value]="role.name">{{ role.name }}</option>
              </select>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="closeForm()" class="px-4 py-2 text-gray-600">Cancel</button>
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
  availableRoles: Role[] = [];
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
      roles: [[]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers() {
    this.userService.getUsers().subscribe((res: any) => {
      this.users = res.data;
    });
  }

  loadRoles() {
    this.roleService.getRoles().subscribe((res: any) => {
      this.availableRoles = res.data;
    });
  }

  openForm() {
    this.selectedUser = null;
    this.userForm.reset({ roles: [] });
    this.showForm = true;
  }

  editUser(user: User) {
    this.selectedUser = user;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      password: '',
      roles: user.roles?.map((r: any) => r.name) || []
    });
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe(() => this.loadUsers());
    }
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    const val = this.userForm.value;
    if (this.selectedUser) {
      if (!val.password) delete val.password;
      this.userService.updateUser(this.selectedUser.id, val).subscribe(() => {
        this.loadUsers();
        this.closeForm();
      });
    } else {
      this.userService.createUser(val).subscribe(() => {
        this.loadUsers();
        this.closeForm();
      });
    }
  }
}
