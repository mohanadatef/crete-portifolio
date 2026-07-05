import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CustomReportService } from '../../core/services/custom-report.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit {
  private http = inject(HttpClient);
  private customReportService = inject(CustomReportService);
  private userService = inject(UserService);

  status = signal<'loading' | 'success' | 'error'>('loading');
  activeReport = signal<'leads' | 'projects' | 'campaigns' | 'custom'>('leads');
  reportData = signal<any>(null);

  // Custom Reports State
  customReports = signal<any[]>([]);
  runningReportData = signal<any>(null);
  runningReportStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  showBuilder = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  users = signal<any[]>([]);

  newReport = {
    id: null as number | null,
    name: '',
    description: '',
    entity_type: 'leads',
    config: {
      columns: ['name', 'email', 'status', 'created_at'] as string[],
      filters: {
        date_from: '',
        date_to: '',
        status: '',
        source: '',
        assigned_to: '',
        location: ''
      },
      group_by: '',
      chart_type: 'table'
    }
  };

  ngOnInit() {
    this.fetchReports();
    this.loadCustomReports();
    this.loadUsers();
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

  loadCustomReports() {
    this.customReportService.getAll().subscribe({
      next: (res) => {
        this.customReports.set(res.data || []);
      },
      error: (err) => {
        console.error('Error fetching custom reports:', err);
      }
    });
  }

  loadUsers() {
    this.userService.getAll().subscribe({
      next: (res: any) => {
        this.users.set(res.data?.data || res.data || []);
      }
    });
  }

  setActiveReport(reportType: 'leads' | 'projects' | 'campaigns' | 'custom') {
    this.activeReport.set(reportType);
  }

  onEntityTypeChange() {
    // Reset columns and group_by when entity type changes
    if (this.newReport.entity_type === 'leads') {
      this.newReport.config.columns = ['name', 'email', 'status', 'created_at'];
    } else if (this.newReport.entity_type === 'projects') {
      this.newReport.config.columns = ['title_en', 'location', 'views_count', 'created_at'];
    } else if (this.newReport.entity_type === 'landing_pages') {
      this.newReport.config.columns = ['title', 'slug', 'created_at'];
    }
    this.newReport.config.group_by = '';
    
    // Clear filters
    this.newReport.config.filters = {
      date_from: '',
      date_to: '',
      status: '',
      source: '',
      assigned_to: '',
      location: ''
    };
  }

  getAvailableColumns(): string[] {
    if (this.newReport.entity_type === 'leads') {
      return ['name', 'email', 'phone', 'message', 'status', 'source', 'utm_source', 'utm_campaign', 'created_at'];
    } else if (this.newReport.entity_type === 'projects') {
      return ['title_en', 'title_ar', 'location', 'views_count', 'created_at'];
    } else if (this.newReport.entity_type === 'landing_pages') {
      return ['title', 'slug', 'created_at'];
    }
    return [];
  }

  getAvailableGroupBy(): string[] {
    if (this.newReport.entity_type === 'leads') {
      return ['status', 'source', 'utm_source', 'utm_campaign', 'utm_medium', 'assigned_to'];
    } else if (this.newReport.entity_type === 'projects') {
      return ['location'];
    } else if (this.newReport.entity_type === 'landing_pages') {
      return ['slug'];
    }
    return [];
  }

  toggleColumn(col: string) {
    const idx = this.newReport.config.columns.indexOf(col);
    if (idx > -1) {
      // Don't empty the columns entirely
      if (this.newReport.config.columns.length > 1) {
        this.newReport.config.columns.splice(idx, 1);
      }
    } else {
      this.newReport.config.columns.push(col);
    }
  }

  isColumnSelected(col: string): boolean {
    return this.newReport.config.columns.includes(col);
  }

  openCreateForm() {
    this.isEditing.set(false);
    this.newReport = {
      id: null,
      name: '',
      description: '',
      entity_type: 'leads',
      config: {
        columns: ['name', 'email', 'status', 'created_at'],
        filters: {
          date_from: '',
          date_to: '',
          status: '',
          source: '',
          assigned_to: '',
          location: ''
        },
        group_by: '',
        chart_type: 'table'
      }
    };
    this.showBuilder.set(true);
  }

  openEditForm(report: any) {
    this.isEditing.set(true);
    // Deep clone config to avoid direct mutations
    const configClone = JSON.parse(JSON.stringify(report.config));
    
    // Ensure all filters properties exist
    if (!configClone.filters) {
      configClone.filters = {};
    }
    configClone.filters = {
      date_from: configClone.filters.date_from || '',
      date_to: configClone.filters.date_to || '',
      status: configClone.filters.status || '',
      source: configClone.filters.source || '',
      assigned_to: configClone.filters.assigned_to || '',
      location: configClone.filters.location || ''
    };

    this.newReport = {
      id: report.id,
      name: report.name,
      description: report.description || '',
      entity_type: report.entity_type,
      config: configClone
    };
    this.showBuilder.set(true);
  }

  saveReport() {
    if (!this.newReport.name) {
      alert('Please enter a report name.');
      return;
    }

    if (this.isEditing() && this.newReport.id) {
      this.customReportService.update(this.newReport.id, this.newReport).subscribe({
        next: () => {
          this.showBuilder.set(false);
          this.loadCustomReports();
          alert('Report updated successfully.');
        },
        error: (err) => {
          console.error('Failed to update custom report:', err);
          alert('Failed to update report.');
        }
      });
    } else {
      this.customReportService.create(this.newReport).subscribe({
        next: () => {
          this.showBuilder.set(false);
          this.loadCustomReports();
          alert('Report created successfully.');
        },
        error: (err) => {
          console.error('Failed to create custom report:', err);
          alert('Failed to create report.');
        }
      });
    }
  }

  deleteReport(id: number) {
    if (confirm('Are you sure you want to delete this custom report?')) {
      this.customReportService.delete(id).subscribe({
        next: () => {
          this.loadCustomReports();
          // If we deleted the active running report, clear it
          if (this.runningReportData()?.report?.id === id) {
            this.runningReportData.set(null);
          }
          alert('Report deleted.');
        },
        error: (err) => {
          console.error('Failed to delete report:', err);
          alert('Failed to delete report.');
        }
      });
    }
  }

  runReport(id: number) {
    this.runningReportStatus.set('loading');
    this.customReportService.run(id).subscribe({
      next: (res) => {
        this.runningReportData.set(res.data);
        this.runningReportStatus.set('success');
      },
      error: (err) => {
        console.error('Failed to run custom report:', err);
        this.runningReportStatus.set('error');
      }
    });
  }

  getAgentName(userId: any): string {
    const user = this.users().find(u => u.id === Number(userId));
    return user ? user.name : 'Unknown';
  }
}
