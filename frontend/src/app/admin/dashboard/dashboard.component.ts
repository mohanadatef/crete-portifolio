import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  stats: any = null;

  ngOnInit() {
    this.http.get('http://backend.test/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('token') : null)}` }
    }).subscribe(res => {
      this.stats = res;
    });
  }
}
