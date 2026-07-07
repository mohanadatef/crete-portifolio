import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, TranslateDirective],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private http = inject(HttpClient);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);
  private route = inject(ActivatedRoute);
  
  backendUrl = environment.backendUrl;
  projects: any[] = [];
  projectTypes: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';

  getPrimaryImagePath(project: any): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find((img: any) => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  getProjectImageUrl(project: any): string {
    if (!project.images || project.images.length === 0) {
      return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80';
    }
    const path = this.getPrimaryImagePath(project);
    if (!path) {
      return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return this.backendUrl + (path.startsWith('/') ? '' : '/') + path;
  }
  
  filters: {
    project_type_id: string;
    location: string;
    min_price: number | null;
    max_price: number | null;
    bedrooms: number | null;
  } = {
    project_type_id: '',
    location: '',
    min_price: null,
    max_price: null,
    bedrooms: null
  };

  ngOnInit() {
    const siteName = this.settingService.getSetting('site_name') || 'CRETE Developments';
    this.seoService.updateTitle(`Projects | ${siteName}`);
    this.loadProjectTypes();
    
    this.route.queryParams.subscribe(params => {
      this.filters.project_type_id = params['project_type_id'] || '';
      this.filters.location = params['location'] || '';
      this.filters.min_price = params['min_price'] ? Number(params['min_price']) : null;
      this.filters.max_price = params['max_price'] ? Number(params['max_price']) : null;
      this.filters.bedrooms = params['bedrooms'] ? Number(params['bedrooms']) : null;
      this.loadProjects();
    });
  }

  loadProjectTypes() {
    this.http.get<any>(`${environment.apiUrl}/public/project-types`).subscribe({
      next: (res) => {
        this.projectTypes = res.data || [];
      },
      error: (err) => console.error('Error loading project types', err)
    });
  }

  loadProjects() {
    this.status = 'loading';
    let params: any = {};
    if (this.filters.project_type_id) params.project_type_id = this.filters.project_type_id;
    if (this.filters.location) params.location = this.filters.location;
    if (this.filters.min_price) params.min_price = this.filters.min_price;
    if (this.filters.max_price) params.max_price = this.filters.max_price;
    if (this.filters.bedrooms) params.bedrooms = this.filters.bedrooms;

    this.http.get<any>(`${environment.apiUrl}/public/projects`, { params }).subscribe({
      next: (res) => {
        const paginatedData = res.data || {};
        const projectsArray = paginatedData.data || res || [];
        this.projects = Array.isArray(projectsArray) ? projectsArray : [];
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }

  applyFilters() {
    this.loadProjects();
  }

  stripHtml(html: string | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
