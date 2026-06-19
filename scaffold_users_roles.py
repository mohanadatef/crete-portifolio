import os

components = [
    {
        'name': 'Users',
        'singular': 'User',
        'variable': 'users',
        'singular_var': 'user',
        'path': 'users/users',
        'service': 'UserService',
        'service_import': '../../core/services/user.service',
        'fields': ['name', 'email', 'password', 'status'],
        'html_template_replacements': {
            '{{ item.title_en || item.name_en }}': '{{ item.name }}',
            '({{ item.title_ar || item.name_ar }})': '({{ item.email }})'
        }
    },
    {
        'name': 'Roles',
        'singular': 'Role',
        'variable': 'roles',
        'singular_var': 'role',
        'path': 'roles/roles',
        'service': 'RoleService',
        'service_import': '../../core/services/role.service',
        'fields': ['name'],
        'html_template_replacements': {
            '{{ item.title_en || item.name_en }}': '{{ item.name }}',
            '({{ item.title_ar || item.name_ar }})': ''
        }
    }
]

ts_template = """import {{ Component, inject, OnInit, signal }} from '@angular/core';
import {{ CommonModule }} from '@angular/common';
import {{ FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule }} from '@angular/forms';
import {{ {service} }} from '{service_import}';
import {{ {singular} }} from '../../core/models/models';

@Component({{
  selector: 'app-{selector}',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './{selector}.component.html'
}})
export class {name}Component implements OnInit {{
  private dataService = inject({service});
  private fb = inject(FormBuilder);

  {variable} = signal<{singular}[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');
  showModal = signal(false);
  
  dataForm: FormGroup;

  filters = {{
    search: '',
    status: ''
  }};

  constructor() {{
    this.dataForm = this.fb.group({{
{form_fields}
    }});
  }}

  ngOnInit() {{
    this.loadData();
  }}

  loadData() {{
    this.status.set('loading');
    this.dataService.getAll(this.filters).subscribe({{
      next: (response) => {{
        const paginatedData = response.data;
        this.{variable}.set(paginatedData.data || paginatedData || []);
        this.status.set('success');
      }},
      error: () => this.status.set('error')
    }});
  }}

  openModal(item?: {singular}) {{
    if (item) {{
      this.dataForm.patchValue({{
        ...item,
        status: item.status !== undefined ? !!item.status : true,
        password: '' // empty password on edit
      }});
    }} else {{
      this.dataForm.reset({{
        status: true
      }});
    }}
    this.showModal.set(true);
  }}

  closeModal() {{
    this.showModal.set(false);
  }}

  saveData() {{
    if (this.dataForm.invalid) {{
      this.dataForm.markAllAsTouched();
      return;
    }}

    const formValues = this.dataForm.value;
    const data: any = {{}};
    Object.keys(formValues).forEach(key => {{
      if (formValues[key] !== null && formValues[key] !== undefined && formValues[key] !== '') {{
        data[key] = formValues[key];
      }}
    }});
    
    // Check if id exists to update, else create
    if (data.id) {{
        this.dataService.update(data.id, data).subscribe({{
          next: () => {{
            this.closeModal();
            this.loadData();
          }},
          error: (err) => {{
            console.error(err);
            alert('Error saving data.');
          }}
        }});
    }} else {{
        this.dataService.create(data).subscribe({{
          next: () => {{
            this.closeModal();
            this.loadData();
          }},
          error: (err) => {{
            console.error(err);
            alert('Error saving data.');
          }}
        }});
    }}
  }}

  deleteData(id: number) {{
    if (confirm('Are you sure you want to delete this item?')) {{
      this.dataService.delete(id).subscribe({{
        next: () => this.loadData(),
        error: () => alert('Error deleting item')
      }});
    }}
  }}
}}
"""

html_template = """<div class="glass-panel overflow-hidden">
  <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
    <div>
      <h2 class="text-xl font-bold text-gray-800">{name} Management</h2>
      <p class="text-sm text-gray-500 mt-1">Manage {name} (Add, Edit, Delete)</p>
    </div>
    <button (click)="openModal()" class="btn-primary flex items-center gap-2">
      Add {singular}
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
          <th>Status</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr *ngFor="let item of {variable}()">
          <td class="p-4 font-medium text-gray-800">
             {{{{ item.title_en || item.name_en }}}} ({{{{ item.title_ar || item.name_ar }}}})
          </td>
          <td class="p-4">
            <span *ngIf="item.status !== undefined && item.status" class="px-2.5 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
            <span *ngIf="item.status !== undefined && !item.status" class="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Inactive</span>
          </td>
          <td class="p-4 flex gap-2 justify-end">
             <button (click)="openModal(item)" class="text-blue-600 hover:text-blue-800">Edit</button>
             <button *ngIf="item.id" (click)="deleteData(item.id)" class="text-red-600 hover:text-red-800">Delete</button>
          </td>
        </tr>
        <tr *ngIf="{variable}().length === 0">
           <td colspan="3" class="p-8 text-center text-gray-500">No data found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Modal -->
<div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
  <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
      <h3 class="text-lg font-bold text-gray-800">Add/Edit {singular}</h3>
      <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">&times;</button>
    </div>
    <div class="p-6">
      <form [formGroup]="dataForm" (ngSubmit)="saveData()" class="space-y-4">
{html_fields}
        <div class="pt-4 flex justify-end gap-3">
          <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</div>
"""

base_dir = 'frontend/src/app/admin/'

for comp in components:
    form_fields_str = "      id: [null],\n"
    html_fields_str = ""
    
    for field in comp['fields']:
        if field == 'status':
            form_fields_str += f"      {field}: [true],\n"
            html_fields_str += f"""        <div>
          <label class="flex items-center gap-2">
            <input type="checkbox" formControlName="status"> Active
          </label>
        </div>\n"""
        elif field == 'password':
            form_fields_str += f"      {field}: [''],\n"
            html_fields_str += f"""        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{field.replace('_', ' ').title()}</label>
          <input type="password" formControlName="{field}" class="input-premium">
          <p class="text-xs text-gray-500 mt-1">Leave blank if you do not want to change the password.</p>
        </div>\n"""
        else:
            form_fields_str += f"      {field}: ['', Validators.required],\n"
            html_fields_str += f"""        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{field.replace('_', ' ').title()}</label>
          <input type="text" formControlName="{field}" class="input-premium">
        </div>\n"""
        
    selector = comp['path'].split('/')[-1]

    ts_content = ts_template.format(
        name=comp['name'],
        singular=comp['singular'],
        variable=comp['variable'],
        service=comp['service'],
        service_import=comp['service_import'],
        form_fields=form_fields_str,
        selector=selector
    )
    
    html_content = html_template.format(
        name=comp['name'],
        singular=comp['singular'],
        variable=comp['variable'],
        html_fields=html_fields_str
    )
    
    for old, new in comp['html_template_replacements'].items():
        html_content = html_content.replace(old, new)
    
    ts_path = os.path.join(base_dir, comp['path'] + '.component.ts')
    html_path = os.path.join(base_dir, comp['path'] + '.component.html')
    
    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
        
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

print("Scaffolded Users and Roles successfully!")
