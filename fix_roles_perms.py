import os

ts_content = """import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
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
    status: ''
  };

  constructor() {
    this.dataForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadData();
    this.loadPermissions();
  }

  loadData() {
    this.status.set('loading');
    this.dataService.getAll(this.filters).subscribe({
      next: (response) => {
        const paginatedData = response.data;
        this.roles.set(paginatedData.data || paginatedData || []);
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
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
      // Extract permission names if they exist
      const perms = item.permissions ? item.permissions.map(p => p.name) : [];
      this.selectedPermissions.set(perms);
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
          },
          error: (err) => {
            console.error(err);
            alert('Error saving data.');
          }
        });
    } else {
        this.dataService.create(data).subscribe({
          next: () => {
            this.closeModal();
            this.loadData();
          },
          error: (err) => {
            console.error(err);
            alert('Error saving data.');
          }
        });
    }
  }

  deleteData(id: number) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.dataService.delete(id).subscribe({
        next: () => this.loadData(),
        error: () => alert('Error deleting item')
      });
    }
  }
}
"""

html_content = """<div class="glass-panel overflow-hidden">
  <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Roles Management</h2>
      <p class="text-sm text-gray-500 mt-1">Manage Roles (Add, Edit, Delete)</p>
    </div>
    <button (click)="openModal()" class="btn-primary flex items-center gap-2">
      Add Role
    </button>
  </div>

  <div class="p-4 bg-white/30 border-b border-gray-100 flex gap-4">
    <input type="text" [(ngModel)]="filters.search" placeholder="Search..." class="input-premium w-1/3">
    <button (click)="loadData()" class="btn-secondary">Apply Filters</button>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr>
          <th>Name / Info</th>
          <th>Permissions Count</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr *ngFor="let item of roles()">
          <td class="p-4 font-medium text-gray-800">
             {{ item.name }} 
          </td>
          <td class="p-4">
            <span class="px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                {{ item.permissions?.length || 0 }} Permissions
            </span>
          </td>
          <td class="p-4 flex gap-2 justify-end">
             <button (click)="openModal(item)" class="text-blue-600 hover:text-blue-800">Edit</button>
             <button *ngIf="item.id" (click)="deleteData(item.id)" class="text-red-600 hover:text-red-800">Delete</button>
          </td>
        </tr>
        <tr *ngIf="roles().length === 0">
           <td colspan="3" class="p-8 text-center text-gray-500">No data found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Modal -->
<div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
  <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
    <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
      <h3 class="text-lg font-bold text-gray-800">Add/Edit Role</h3>
      <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">&times;</button>
    </div>
    <div class="p-6 overflow-y-auto grow">
      <form [formGroup]="dataForm" (ngSubmit)="saveData()" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" formControlName="name" class="input-premium">
        </div>
        
        <div class="mt-6 border-t border-gray-100 pt-6">
          <label class="block text-sm font-medium text-gray-700 mb-4">Role Permissions</label>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div *ngFor="let perm of allPermissions()" class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
              <input type="checkbox" [id]="'perm_' + perm" [checked]="hasPermission(perm)" (change)="togglePermission(perm, $event)" class="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 w-4 h-4">
              <label [for]="'perm_' + perm" class="text-sm text-gray-600 cursor-pointer w-full">{{ perm }}</label>
            </div>
          </div>
          
          <div *ngIf="allPermissions().length === 0" class="text-sm text-gray-500 italic">
            No permissions available.
          </div>
        </div>

        <div class="pt-6 mt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</div>
"""

ts_path = 'frontend/src/app/admin/roles/roles.component.ts'
html_path = 'frontend/src/app/admin/roles/roles.component.html'

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Roles component completely rewritten to support permissions checkboxing!")
