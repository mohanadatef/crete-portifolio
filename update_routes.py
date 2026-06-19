import re

with open('frontend/src/app/app.routes.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("'manage-users'", "'view-users'")
c = c.replace("'manage-roles'", "'view-roles'")
c = c.replace("'manage-projects'", "'view-projects'")
c = c.replace("'manage-project-types'", "'view-project-types'")
c = c.replace("path: 'landing-pages', component: LandingPagesComponent, canActivate: [PermissionGuard], data: { permission: 'manage-pages' }", "path: 'landing-pages', component: LandingPagesComponent, canActivate: [PermissionGuard], data: { permission: 'view-landing-pages' }")
c = c.replace("path: 'pages', component: PagesComponent, canActivate: [PermissionGuard], data: { permission: 'manage-pages' }", "path: 'pages', component: PagesComponent, canActivate: [PermissionGuard], data: { permission: 'view-pages' }")
c = c.replace("'manage-leads'", "'view-leads'")
c = c.replace("path: 'blog/posts', component: BlogPostsComponent, canActivate: [PermissionGuard], data: { permission: 'manage-blog' }", "path: 'blog/posts', component: BlogPostsComponent, canActivate: [PermissionGuard], data: { permission: 'view-blog-posts' }")
c = c.replace("path: 'blog/categories', component: BlogCategoriesComponent, canActivate: [PermissionGuard], data: { permission: 'manage-blog' }", "path: 'blog/categories', component: BlogCategoriesComponent, canActivate: [PermissionGuard], data: { permission: 'view-blog-categories' }")
c = c.replace("'manage-settings'", "'view-settings'")

with open('frontend/src/app/app.routes.ts', 'w', encoding='utf-8') as f:
    f.write(c)
