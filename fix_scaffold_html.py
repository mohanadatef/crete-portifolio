import os

components = [
    {
        'path': 'pages/pages',
        'is_name': False
    },
    {
        'path': 'landing-pages/landing-pages',
        'is_name': False
    },
    {
        'path': 'blog/categories/categories',
        'is_name': True
    },
    {
        'path': 'blog/posts/posts',
        'is_name': False
    }
]

base_dir = 'frontend/src/app/admin/'

for comp in components:
    html_path = os.path.join(base_dir, comp['path'] + '.component.html')
    
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if comp['is_name']:
        content = content.replace('{{ item.title_en || item.name_en }}', '{{ item.name_en }}')
        content = content.replace('{{ item.title_ar || item.name_ar }}', '{{ item.name_ar }}')
    else:
        content = content.replace('{{ item.title_en || item.name_en }}', '{{ item.title_en }}')
        content = content.replace('{{ item.title_ar || item.name_ar }}', '{{ item.title_ar }}')
        
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Templates fixed!")
