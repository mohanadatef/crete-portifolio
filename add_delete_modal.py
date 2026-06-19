import os

ts_path = 'frontend/src/app/admin/roles/roles.component.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Replace deleteData with new modal logic
new_delete_logic = """  deleteId = signal<number | null>(null);

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
}"""

import re
ts_content = re.sub(r"  deleteData\(id: number\) \{.*\}\s*\}", new_delete_logic, ts_content, flags=re.DOTALL)

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

html_path = 'frontend/src/app/admin/roles/roles.component.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Replace old delete button
html_content = html_content.replace(
    """<button *ngIf="item.id" (click)="deleteData(item.id)" class="text-red-600 hover:text-red-900 mx-2 transition-colors">""",
    """<button *ngIf="item.id" (click)="confirmDelete(item.id)" class="text-red-600 hover:text-red-900 mx-2 transition-colors">"""
)

# Add Modal
modal_html = """
<!-- Delete Confirmation Modal -->
<div *ngIf="deleteId() !== null" class="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <div class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
    <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm" aria-hidden="true" (click)="cancelDelete()"></div>

    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

    <div class="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6 border border-gray-100">
      <div class="sm:flex sm:items-start">
        <div class="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
          <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          <h3 class="text-lg font-bold leading-6 text-gray-900" id="modal-title">Delete Confirmation</h3>
          <div class="mt-2">
            <p class="text-sm text-gray-500">Are you sure you want to delete this item? This action is permanent and cannot be undone.</p>
          </div>
        </div>
      </div>
      <div class="mt-6 sm:flex sm:flex-row-reverse gap-2">
        <button type="button" class="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-5 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transition-colors" (click)="executeDelete()">
          Yes, Delete it
        </button>
        <button type="button" class="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-5 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 sm:mt-0 sm:w-auto sm:text-sm transition-colors" (click)="cancelDelete()">
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
"""

html_content += modal_html

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Delete Modal added!")
