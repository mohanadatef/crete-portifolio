import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';

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
  projects: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';

  ngOnInit() {
    this.http.get<any>('http://backend.test/api/v1/public/projects').subscribe({
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
