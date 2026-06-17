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
    this.http.get('http://127.0.0.1:8000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe(res => {
      this.stats = res;
    });
  }
}
