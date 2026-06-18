import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService, Role, Permission } from '../../services/role.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold">Roles & Permissions</h1>
        <button (click)="openForm()" class="bg-crete-gold hover:bg-yellow-600 text-white px-4 py-2 rounded">Add Role</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let role of roles" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
          <h2 class="text-xl font-bold mb-4 flex items-center justify-between">
            {{ role.name }}
            <div class="space-x-2" *ngIf="role.name !== 'admin'">
              <button (click)="editRole(role)" class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              <button (click)="deleteRole(role.id)" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
            </div>
            <span *ngIf="role.name === 'admin'" class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">System Role</span>
          </h2>
          
          <div class="space-y-2">
            <span *ngFor="let perm of role.permissions" class="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-100 mr-2 mb-2">
              {{ perm }}
            </span>
            <span *ngIf="!role.permissions?.length" class="text-gray-400 text-sm italic">No permissions assigned</span>
            <span *ngIf="role.name === 'admin'" class="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-100 mr-2 mb-2">
              * All Permissions
            </span>
          </div>
        </div>
      </div>

      <!-- Role Form Modal -->
      <div *ngIf="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-xl w-[600px] max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-4">{{ selectedRole ? 'Edit Role' : 'Add Role' }}</h2>
          <form [formGroup]="roleForm" (ngSubmit)="onSubmit()">
            <div class="mb-6">
              <label class="block text-sm font-medium mb-1">Role Name</label>
              <input type="text" formControlName="name" class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div class="mb-6">
              <label class="block text-sm font-medium mb-3">Permissions</label>
              <div class="grid grid-cols-2 gap-3">
                <label *ngFor="let perm of allPermissions" class="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded border">
                  <input type="checkbox" [value]="perm" (change)="onPermissionChange($event, perm)" [checked]="isPermissionSelected(perm)" class="rounded text-blue-600" />
                  <span class="text-sm">{{ perm }}</span>
                </label>
              </div>
            </div>

            <div class="flex justify-end space-x-2 pt-4 border-t">
              <button type="button" (click)="closeForm()" class="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">Cancel</button>
              <button type="submit" [disabled]="roleForm.invalid" class="px-4 py-2 bg-crete-gold text-white rounded hover:bg-yellow-600 disabled:opacity-50">Save Role</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  allPermissions: string[] = [];
  showForm = false;
  selectedRole: Role | null = null;
  roleForm: FormGroup;
  selectedPermissions: Set<string> = new Set();

  constructor(
    private roleService: RoleService,
    private fb: FormBuilder
  ) {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe((res: any) => {
      this.roles = res.data;
    });
  }

  loadPermissions() {
    this.roleService.getPermissions().subscribe((res: any) => {
      this.allPermissions = res.data;
    });
  }

  openForm() {
    this.selectedRole = null;
    this.selectedPermissions.clear();
    this.roleForm.reset();
    this.showForm = true;
  }

  editRole(role: Role) {
    if (role.name === 'admin') return;
    this.selectedRole = role;
    this.selectedPermissions = new Set(role.permissions || []);
    this.roleForm.patchValue({ name: role.name });
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  onPermissionChange(event: any, permission: string) {
    if (event.target.checked) {
      this.selectedPermissions.add(permission);
    } else {
      this.selectedPermissions.delete(permission);
    }
  }

  isPermissionSelected(permission: string): boolean {
    return this.selectedPermissions.has(permission);
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.deleteRole(id).subscribe(() => this.loadRoles());
    }
  }

  onSubmit() {
    if (this.roleForm.invalid) return;

    const val = {
      name: this.roleForm.value.name,
      permissions: Array.from(this.selectedPermissions)
    };

    if (this.selectedRole) {
      this.roleService.updateRole(this.selectedRole.id, val).subscribe(() => {
        this.loadRoles();
        this.closeForm();
      });
    } else {
      this.roleService.createRole(val).subscribe(() => {
        this.loadRoles();
        this.closeForm();
      });
    }
  }
}
