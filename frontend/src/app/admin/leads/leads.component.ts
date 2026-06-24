import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.scss'
})
export class LeadsComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  
  leads: any[] = [];
  users: any[] = [];
  projects: any[] = [];
  landingPages: any[] = [];
  
  status: 'loading' | 'success' | 'error' = 'loading';
  
  // Pagination
  currentPage: number = 1;
  lastPage: number = 1;
  perPage: number = 15;
  totalRecords: number = 0;
  
  // Filters
  filters = {
    search: '',
    status: '',
    assigned_to: '',
    landing_page_id: '',
    project_id: ''
  };

  ngOnInit() {
    this.loadFiltersData();
    this.loadLeads();
  }

  loadFiltersData() {
    const headers = { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` };
    forkJoin({
      users: this.http.get<any>(`${environment.apiUrl}/admin/users`, { headers }),
      projects: this.http.get<any>(`${environment.apiUrl}/admin/projects`, { headers }),
      landingPages: this.http.get<any>(`${environment.apiUrl}/admin/landing-pages`, { headers })
    }).subscribe({
      next: (res) => {
        const extractArr = (response: any) => response?.data?.data || response?.data || response || [];
        this.users = extractArr(res.users);
        this.projects = extractArr(res.projects);
        this.landingPages = extractArr(res.landingPages);
      }
    });
  }

  loadLeads(page: number = 1) {
    this.status = 'loading';
    const headers = { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` };
    
    // Build query params
    let params = new URLSearchParams();
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    params.append('page', page.toString());
    params.append('per_page', this.perPage.toString());

    this.http.get<any>(`${environment.apiUrl}/admin/leads?${params.toString()}`, { headers }).subscribe({
      next: (res) => {
        const paginatedData = res.data;
        this.leads = paginatedData.data || paginatedData || [];
        this.currentPage = paginatedData.current_page || 1;
        this.lastPage = paginatedData.last_page || 1;
        this.totalRecords = paginatedData.total || this.leads.length;
        this.status = 'success';
      },
      error: () => this.status = 'error'
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.loadLeads(page);
    }
  }

  changePerPage(event: any) {
    this.perPage = parseInt(event.target.value, 10);
    this.loadLeads(1);
  }

  applyFilters() {
    this.loadLeads(1);
  }

  resetFilters() {
    this.filters = { search: '', status: '', assigned_to: '', landing_page_id: '', project_id: '' };
    this.loadLeads(1);
  }

  // Modals
  isLogsModalOpen: boolean = false;
  selectedLeadLogs: any[] = [];
  selectedLeadForLogs: any = null;
  isExporting: boolean = false;

  exportLeads() {
    this.isExporting = true;
    let params = new URLSearchParams();
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const url = `${environment.apiUrl}/admin/leads/export?${params.toString()}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // To trigger download with Authorization header, we fetch the blob and create an object URL
    this.http.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = 'leads.csv';
        a.click();
        URL.revokeObjectURL(objectUrl);
        this.isExporting = false;
      },
      error: () => {
        alert('Failed to export leads. You may not have permission.');
        this.isExporting = false;
      }
    });
  }

  viewLogs(lead: any) {
    this.selectedLeadForLogs = lead;
    this.isLogsModalOpen = true;
    this.selectedLeadLogs = [];
    
    const headers = { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` };
    this.http.get<any>(`${environment.apiUrl}/admin/leads/${lead.id}/logs`, { headers }).subscribe({
      next: (res) => {
        this.selectedLeadLogs = res.data || [];
      },
      error: (err) => {
        console.error('Failed to load logs', err);
      }
    });
  }

  closeLogsModal() {
    this.isLogsModalOpen = false;
    this.selectedLeadForLogs = null;
    this.selectedLeadLogs = [];
  }

  updateLead(lead: any, field: string, value: string) {
    const originalValue = lead[field];
    lead[field] = value; // optimistic update
    
    const headers = { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` };
    this.http.put(`${environment.apiUrl}/admin/leads/${lead.id}`, { [field]: value }, { headers })
      .subscribe({
        next: () => {
          // Success, keep optimistic update
        },
        error: () => {
          // Revert on error
          lead[field] = originalValue;
          alert('Failed to update lead');
        }
      });
  }

  getKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }

  getEmail(lead: any): string {
    if (lead.email && lead.email !== 'N/A') return lead.email;
    if (lead.form_data) {
      // Find a field containing '@'
      for (const key of Object.keys(lead.form_data)) {
        const val = lead.form_data[key];
        if (typeof val === 'string' && val.includes('@')) return val;
      }
    }
    return 'N/A';
  }

  getPhone(lead: any): string {
    if (lead.phone && lead.phone !== 'N/A') return lead.phone;
    if (lead.form_data) {
      // Try to find a field that looks like a phone
      for (const key of Object.keys(lead.form_data)) {
        const val = lead.form_data[key];
        if (typeof val === 'string' && /^[0-9+\-\s()]{8,}$/.test(val)) return val;
      }
    }
    return 'N/A';
  }
}
