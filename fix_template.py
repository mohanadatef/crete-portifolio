import re

path = 'frontend/src/app/admin/projects/projects.component.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('p.status == 1', 'p.status')
content = content.replace('p.status == 0', '!p.status')
content = content.replace('p.title_en?.charAt', 'p.title_en.charAt')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Template fixed")
