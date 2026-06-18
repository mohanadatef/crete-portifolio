import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { HomeComponent } from './public/home/home.component';
import { LoginComponent } from './admin/login/login.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { ProjectsComponent } from './admin/projects/projects.component';
import { PagesComponent } from './admin/pages/pages.component';
import { SettingsComponent } from './admin/settings/settings.component';
import { LandingPagesComponent } from './admin/landing-pages/landing-pages.component';
import { LeadsComponent } from './admin/leads/leads.component';
import { CategoriesComponent } from './admin/blog/categories/categories.component';
import { PostsComponent } from './admin/blog/posts/posts.component';
import { BlogComponent } from './public/blog/blog.component';
import { ContactComponent } from './public/contact/contact.component';

import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            { path: '', component: HomeComponent },
            { path: 'projects', loadComponent: () => import('./public/projects/projects.component').then(m => m.ProjectsComponent) },
            { path: 'blog', component: BlogComponent },
            { path: 'contact', component: ContactComponent }
        ]
    },
    {
        path: 'admin/login',
        component: LoginComponent
    },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { 
                path: 'users', 
                loadComponent: () => import('./admin/users/users.component').then(m => m.UsersComponent),
                canActivate: [permissionGuard],
                data: { permission: 'manage-users' }
            },
            { 
                path: 'roles', 
                loadComponent: () => import('./admin/roles/roles.component').then(m => m.RolesComponent),
                canActivate: [permissionGuard],
                data: { permission: 'manage-roles' }
            },
            { 
                path: 'projects', 
                component: ProjectsComponent,
                canActivate: [permissionGuard],
                data: { permission: 'manage-projects' }
            },
            { 
                path: 'pages', 
                component: PagesComponent,
                canActivate: [permissionGuard],
                data: { permission: 'manage-pages' }
            },
            { 
                path: 'settings', 
                component: SettingsComponent,
                canActivate: [permissionGuard],
                data: { permission: 'manage-settings' }
            },
            { 
                path: 'landing-pages', 
                component: LandingPagesComponent,
                canActivate: [permissionGuard],
                data: { permission: 'manage-pages' }
            },
            { 
                path: 'leads', 
                component: LeadsComponent,
                canActivate: [permissionGuard],
                data: { permission: 'manage-leads' }
            },
            { 
                path: 'blog/categories', 
                component: CategoriesComponent,
                canActivate: [permissionGuard],
                data: { permission: 'manage-blog' }
            },
            { 
                path: 'blog/posts', 
                component: PostsComponent,
                canActivate: [permissionGuard],
                data: { permission: 'manage-blog' }
            },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    }
];
