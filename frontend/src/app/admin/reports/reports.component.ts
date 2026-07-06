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

  // Client-side search and sorting state
  searchQuery = signal<string>('');
  sortField = signal<string>('');
  sortAsc = signal<boolean>(true);

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
      chart_type: 'table',
      is_shared: false,
      aggregation_function: 'count',
      aggregation_column: '*',
      date_group_interval: 'daily'
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

    // Reset aggregation keys
    this.newReport.config.aggregation_function = 'count';
    this.newReport.config.aggregation_column = '*';
    this.newReport.config.date_group_interval = 'daily';
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
      return ['status', 'source', 'utm_source', 'utm_campaign', 'utm_medium', 'assigned_to', 'created_at'];
    } else if (this.newReport.entity_type === 'projects') {
      return ['location', 'created_at'];
    } else if (this.newReport.entity_type === 'landing_pages') {
      return ['slug', 'created_at'];
    }
    return [];
  }

  getAvailableAggregationColumns(): string[] {
    if (this.newReport.entity_type === 'projects') {
      return ['views_count'];
    }
    // leads and landing_pages don't have views_count directly, but they can be counted
    return [];
  }

  toggleColumn(col: string) {
    const idx = this.newReport.config.columns.indexOf(col);
    if (idx > -1) {
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
        chart_type: 'table',
        is_shared: false,
        aggregation_function: 'count',
        aggregation_column: '*',
        date_group_interval: 'daily'
      }
    };
    this.showBuilder.set(true);
  }

  openEditForm(report: any) {
    this.isEditing.set(true);
    const configClone = JSON.parse(JSON.stringify(report.config));
    
    // Ensure nested parameters exist
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

    configClone.is_shared = !!configClone.is_shared;
    configClone.aggregation_function = configClone.aggregation_function || 'count';
    configClone.aggregation_column = configClone.aggregation_column || '*';
    configClone.date_group_interval = configClone.date_group_interval || 'daily';

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
          if (this.runningReportData()?.report?.id === id) {
            this.runningReportData.set(null);
            this.runningReportStatus.set('idle');
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
        // Reset sort/search state when running a new report
        this.searchQuery.set('');
        this.sortField.set('');
        this.sortAsc.set(true);
      },
      error: (err) => {
        console.error('Failed to run custom report:', err);
        this.runningReportStatus.set('error');
      }
    });
  }

  exportToCsv(id: number, name: string) {
    this.customReportService.exportCsv(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_')}_data.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to export CSV:', err);
        alert('Failed to export CSV report.');
      }
    });
  }

  sortColumn(col: string) {
    if (this.sortField() === col) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortField.set(col);
      this.sortAsc.set(true);
    }
  }

  getSortedResults(): any[] {
    const data = this.runningReportData();
    if (!data || !data.results) return [];
    
    let results = [...data.results];

    // Apply Client-Side Search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      results = results.filter(row => {
        return Object.keys(row).some(key => {
          const val = row[key];
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') {
            return Object.keys(val).some(subKey => {
              const subVal = val[subKey];
              return subVal && String(subVal).toLowerCase().includes(query);
            });
          }
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // Apply Client-Side Sorting
    const field = this.sortField();
    if (field) {
      const asc = this.sortAsc();
      results.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        // Format references/nested fields if sorting relationship columns
        if (field === 'project_id' && a.project) valA = a.project.title_en;
        if (field === 'project_id' && b.project) valB = b.project.title_en;
        if (field === 'landing_page_id' && a.landingPage) valA = a.landingPage.title;
        if (field === 'landing_page_id' && b.landingPage) valB = b.landingPage.title;
        if (field === 'assigned_to' && a.assignedTo) valA = a.assignedTo.name;
        if (field === 'assigned_to' && b.assignedTo) valB = b.assignedTo.name;

        if (valA === null || valA === undefined) return asc ? 1 : -1;
        if (valB === null || valB === undefined) return asc ? -1 : 1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return asc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    return results;
  }

  getAgentName(userId: any): string {
    const user = this.users().find(u => u.id === Number(userId));
    return user ? user.name : 'Unknown';
  }
}
