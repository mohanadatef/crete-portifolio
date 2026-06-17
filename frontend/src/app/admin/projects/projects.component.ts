import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private http = inject(HttpClient);
  projects: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';

  ngOnInit() {
    this.http.get<any[]>('http://127.0.0.1:8000/api/admin/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (data) => {
        this.projects = data;
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }
}
