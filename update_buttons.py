import os
import re

base_path = 'frontend/src/app/admin'

modules = {
    'users': 'users',
    'roles': 'roles',
    'projects': 'projects',
    'project-types': 'project-types',
    'landing-pages': 'landing-pages',
    'pages': 'pages',
    'leads': 'leads',
    'blog/categories': 'blog-categories',
    'blog/posts': 'blog-posts',
    'settings': 'settings'
}

for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.component.html'):
            path = os.path.join(root, file)
            mod_name = None
            for key, val in modules.items():
                if key.replace('/', os.sep) in path or key in path:
                    mod_name = val
                    break
            
            if not mod_name:
                continue
                
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Skip if we already added it
            if "*appHasPermission" not in content:
                # Add create permission to Add button
                content = re.sub(r'(<button)([^>]*\(click\)="openModal\(\)"[^>]*)>', r'\1 *appHasPermission="\'create-' + mod_name + r'\'"\2>', content)
                
                # Edit button
                content = re.sub(r'(<button)([^>]*class="[^"]*text-blue-600[^"]*"[^>]*)>', r'\1 *appHasPermission="\'edit-' + mod_name + r'\'"\2>', content)

                # Delete button
                content = re.sub(r'(<button)([^>]*class="[^"]*text-red-600[^"]*"[^>]*)>', r'\1 *appHasPermission="\'delete-' + mod_name + r'\'"\2>', content)

                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {path}")
print("Done")
