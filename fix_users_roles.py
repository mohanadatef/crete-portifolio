import os

# Fix Roles Component
roles_ts = 'frontend/src/app/admin/roles/roles.component.ts'
with open(roles_ts, 'r', encoding='utf-8') as f:
    rts = f.read()
    rts = rts.replace('status: item.status !== undefined ? !!item.status : true,', '')
with open(roles_ts, 'w', encoding='utf-8') as f:
    f.write(rts)

roles_html = 'frontend/src/app/admin/roles/roles.component.html'
with open(roles_html, 'r', encoding='utf-8') as f:
    rhtml = f.read()
    rhtml = rhtml.replace('<span *ngIf="item.status !== undefined && item.status" class="px-2.5 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>', '')
    rhtml = rhtml.replace('<span *ngIf="item.status !== undefined && !item.status" class="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Inactive</span>', '')
with open(roles_html, 'w', encoding='utf-8') as f:
    f.write(rhtml)

# Fix Users Component
users_ts = 'frontend/src/app/admin/users/users.component.ts'
with open(users_ts, 'r', encoding='utf-8') as f:
    uts = f.read()
    uts = uts.replace('status: item.status !== undefined ? !!item.status : true,', 'status: item.is_active !== undefined ? !!item.is_active : true,')
with open(users_ts, 'w', encoding='utf-8') as f:
    f.write(uts)

users_html = 'frontend/src/app/admin/users/users.component.html'
with open(users_html, 'r', encoding='utf-8') as f:
    uhtml = f.read()
    uhtml = uhtml.replace('item.status', 'item.is_active')
with open(users_html, 'w', encoding='utf-8') as f:
    f.write(uhtml)

print("Fixed users and roles properties.")
