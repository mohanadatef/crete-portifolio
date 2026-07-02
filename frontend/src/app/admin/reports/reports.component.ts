import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit {
  private http = inject(HttpClient);

  status = signal<'loading' | 'success' | 'error'>('loading');
  activeReport = signal<'leads' | 'projects' | 'campaigns'>('leads');
  reportData = signal<any>(null);

  ngOnInit() {
    this.fetchReports();
  }

  fetchReports() {
    this.status.set('loading');
    this.http.get<any>(`${environment.apiUrl}/admin/reports`).subscribe({
      next: (res) => {
        this.reportData.set(res.data);
        this.status.set('success');
      },
      error: (err) => {
        console.error('Error fetching reports:', err);
        this.status.set('error');
      }
    });
  }

  setActiveReport(reportType: 'leads' | 'projects' | 'campaigns') {
    this.activeReport.set(reportType);
  }
}
