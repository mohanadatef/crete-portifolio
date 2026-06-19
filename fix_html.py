import re

path = 'frontend/src/app/admin/projects/projects.component.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix signals and arrays
content = content.replace('projectTypes', 'projectTypes()')
# Wait, projectTypes in the select was: "let t of projectTypes"
content = content.replace('let t of projectTypes()', 'let t of projectTypes()') # Safety
content = content.replace('let p of projects', 'let p of projects()')
content = content.replace('*ngIf="showModal"', '*ngIf="showModal()"')
content = content.replace('showModal = false', 'closeModal()')

# Convert forms to ReactiveForms
content = content.replace('<form>', '<form [formGroup]="projectForm" (ngSubmit)="saveProject()">')
content = content.replace('<form class="space-y-4">', '<form [formGroup]="projectForm" (ngSubmit)="saveProject()" class="space-y-4">')

# Replace ngModels with formControlNames
content = re.sub(r'\[\(ngModel\)\]="formData\.([^"]+)"', r'formControlName="\1"', content)

# Remove the click from the save button to rely on ngSubmit
content = content.replace('(click)="saveProject()"', '')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML patched successfully!")
