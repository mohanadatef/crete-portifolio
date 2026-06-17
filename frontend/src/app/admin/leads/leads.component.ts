import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.scss'
})
export class LeadsComponent implements OnInit {
  private http = inject(HttpClient);
  leads: any[] = [];
  status: 'loading' | 'success' | 'error' = 'loading';

  ngOnInit() {
    this.http.get<any[]>('http://127.0.0.1:8000/api/admin/leads', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (data) => {
        this.leads = data;
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }
}
