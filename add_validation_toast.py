import os

ts_path = 'frontend/src/app/admin/roles/roles.component.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Add toasts signal
ts_content = ts_content.replace(
    "searchSubject = new Subject<string>();",
    """searchSubject = new Subject<string>();
  
  toasts = signal<{id: number, message: string, type: 'success' | 'error'}[]>([]);
  toastIdCounter = 0;

  showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = ++this.toastIdCounter;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => {
      this.toasts.update(t => t.filter(toast => toast.id !== id));
    }, 4000);
  }"""
)

# Update saveData error handling
save_data_logic = """
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
"""
import re
ts_content = re.sub(r"if \(data\.id\) \{.*?\}\s*\}", save_data_logic, ts_content, flags=re.DOTALL)

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

html_path = 'frontend/src/app/admin/roles/roles.component.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Fix input field for validation errors
html_input = """
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" formControlName="name" class="input-premium" [ngClass]="{'border-red-500': dataForm.get('name')?.invalid && (dataForm.get('name')?.touched || dataForm.get('name')?.errors?.['serverError'])}">
          <div *ngIf="dataForm.get('name')?.errors?.['required'] && dataForm.get('name')?.touched" class="text-red-500 text-xs mt-1">Name is required.</div>
          <div *ngIf="dataForm.get('name')?.errors?.['serverError']" class="text-red-500 text-xs mt-1">{{ dataForm.get('name')?.errors?.['serverError'] }}</div>
        </div>
"""
html_content = re.sub(r"<div>\s*<label[^>]*>Name</label>\s*<input[^>]*formControlName=\"name\"[^>]*>\s*</div>", html_input, html_content)

# Add Toast Container at the bottom of the file
toast_html = """
<!-- Toast Container -->
<div class="fixed top-4 right-4 z-[60] flex flex-col gap-2">
  <div *ngFor="let toast of toasts()" 
       class="px-4 py-3 rounded-lg shadow-lg text-sm font-medium transform transition-all duration-300 flex items-center gap-2"
       [ngClass]="toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'">
    <svg *ngIf="toast.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
    <svg *ngIf="toast.type === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    {{ toast.message }}
  </div>
</div>
"""
html_content += toast_html

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Validation and Toasts added!")
