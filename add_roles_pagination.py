import os

# 1. Update RoleService.php
role_service_path = 'backend/app/Modules/User/Services/RoleService.php'
with open(role_service_path, 'r', encoding='utf-8') as f:
    rs_content = f.read()

rs_content = rs_content.replace(
    "public function getAllRoles(): Collection\n    {\n        return Role::with('permissions')->get();\n    }",
    """public function getAllRoles(array $filters = []): \\Illuminate\\Contracts\\Pagination\\LengthAwarePaginator
    {
        $query = Role::with('permissions');
        
        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        $perPage = $filters['per_page'] ?? 10;
        
        return $query->paginate($perPage);
    }"""
)
rs_content = rs_content.replace('use Illuminate\Database\Eloquent\Collection;', 'use Illuminate\Database\Eloquent\Collection;\nuse Illuminate\Contracts\Pagination\LengthAwarePaginator;')
with open(role_service_path, 'w', encoding='utf-8') as f:
    f.write(rs_content)

# 2. Update RoleController.php
role_controller_path = 'backend/app/Modules/User/Controllers/RoleController.php'
with open(role_controller_path, 'r', encoding='utf-8') as f:
    rc_content = f.read()

rc_content = rc_content.replace(
    "public function index(): JsonResponse\n    {\n        $roles = $this->roleService->getAllRoles();\n\n        return $this->successResponse(\n            RoleResource::collection($roles),\n            'Roles retrieved successfully'\n        );\n    }",
    """public function index(Request $request): JsonResponse
    {
        $roles = $this->roleService->getAllRoles($request->all());

        return $this->successResponse(
            RoleResource::collection($roles)->response()->getData(true),
            'Roles retrieved successfully'
        );
    }"""
)
with open(role_controller_path, 'w', encoding='utf-8') as f:
    f.write(rc_content)


# 3. Update roles.component.ts
ts_path = 'frontend/src/app/admin/roles/roles.component.ts'
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
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

# 4. Update roles.component.html
html_path = 'frontend/src/app/admin/roles/roles.component.html'
html_content = """<div class="glass-panel overflow-hidden flex flex-col h-full">
  <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50 shrink-0">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Roles Management</h2>
      <p class="text-sm text-gray-500 mt-1">Manage Roles (Add, Edit, Delete)</p>
    </div>
    <button (click)="openModal()" class="btn-primary flex items-center gap-2">
      Add Role
    </button>
  </div>

  <div class="p-4 bg-white/30 border-b border-gray-100 flex justify-between items-center shrink-0">
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">Show</span>
      <select (change)="changePerPage($event)" class="input-premium py-1 px-2 h-auto text-sm">
        <option [selected]="filters.per_page === 10" value="10">10</option>
        <option [selected]="filters.per_page === 25" value="25">25</option>
        <option [selected]="filters.per_page === 50" value="50">50</option>
        <option [selected]="filters.per_page === 100" value="100">100</option>
      </select>
      <span class="text-sm text-gray-600">entries</span>
    </div>
    
    <div class="flex gap-4">
      <input type="text" [(ngModel)]="filters.search" placeholder="Search roles..." class="input-premium w-64" (keyup.enter)="filters.page=1; loadData()">
      <button (click)="filters.page=1; loadData()" class="btn-secondary">Search</button>
    </div>
  </div>

  <div class="overflow-x-auto grow">
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
  
  <div class="p-4 border-t border-gray-100 flex justify-between items-center bg-white/50 shrink-0">
    <div class="text-sm text-gray-600">
      Showing {{ roles().length }} of {{ pagination().total }} entries
    </div>
    <div class="flex gap-1" *ngIf="pagination().last_page > 1">
      <button (click)="changePage(pagination().current_page - 1)" [disabled]="pagination().current_page === 1" class="px-3 py-1 border rounded text-sm disabled:opacity-50 border-gray-200 text-gray-600 hover:bg-gray-50">Prev</button>
      
      <button class="px-3 py-1 border rounded text-sm bg-blue-50 text-blue-600 border-blue-200 font-medium">
        {{ pagination().current_page }} / {{ pagination().last_page }}
      </button>

      <button (click)="changePage(pagination().current_page + 1)" [disabled]="pagination().current_page === pagination().last_page" class="px-3 py-1 border rounded text-sm disabled:opacity-50 border-gray-200 text-gray-600 hover:bg-gray-50">Next</button>
    </div>
  </div>
</div>

<!-- Modal -->
<div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
  <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
    <!-- Header Fixed -->
    <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
      <h3 class="text-lg font-bold text-gray-800">Add/Edit Role</h3>
      <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">&times;</button>
    </div>
    
    <!-- Body Scrollable -->
    <div class="p-6 overflow-y-auto grow bg-white">
      <form [formGroup]="dataForm" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" formControlName="name" class="input-premium">
        </div>
        
        <div class="mt-6 border-t border-gray-100 pt-6">
          <label class="block text-sm font-medium text-gray-700 mb-4">Role Permissions</label>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
            <div *ngFor="let perm of allPermissions()" class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
              <input type="checkbox" [id]="'perm_' + perm" [checked]="hasPermission(perm)" (change)="togglePermission(perm, $event)" class="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 w-4 h-4">
              <label [for]="'perm_' + perm" class="text-sm text-gray-600 cursor-pointer w-full">{{ perm }}</label>
            </div>
          </div>
          
          <div *ngIf="allPermissions().length === 0" class="text-sm text-gray-500 italic">
            No permissions available.
          </div>
        </div>
      </form>
    </div>

    <!-- Footer Fixed -->
    <div class="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50">
      <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
      <button type="button" (click)="saveData()" class="btn-primary">Save Changes</button>
    </div>
  </div>
</div>
"""
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Roles Pagination and Filter Added!")
