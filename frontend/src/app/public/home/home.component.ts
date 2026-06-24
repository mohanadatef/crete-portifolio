import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, TranslatePipe, TranslateDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  public translate = inject(TranslateService);
  backendUrl = environment.backendUrl;
  projects: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';

  getPrimaryImagePath(project: any): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find((img: any) => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/public/projects`).subscribe({
      next: (response) => {
        // Handle paginated response structure from Laravel Resource collection
        const paginatedData = response.data || {};
        const projectsArray = paginatedData.data || response || [];
        
        this.projects = Array.isArray(projectsArray) ? projectsArray.slice(0, 3) : [];
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }
}
