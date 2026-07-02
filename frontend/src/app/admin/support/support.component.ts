import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent implements OnInit {
  private http = inject(HttpClient);

  logFiles: any[] = [];
  loadingFiles = false;
  loadingLogs = false;

  selectedFile: string | null = null;
  parsedLogs: any[] = [];

  searchQuery = '';
  selectedLevel = 'ALL';
  expandedLogIndex: number | null = null;

  // Pagination properties
  page = 1;
  perPage = 50;
  lastPage = 1;
  totalEntries = 0;

  ngOnInit() {
    this.loadLogFiles();
  }

  loadLogFiles() {
    this.loadingFiles = true;
    this.http.get<any>(`${environment.apiUrl}/admin/logs`).subscribe({
      next: (res) => {
        this.logFiles = res.data || [];
        this.loadingFiles = false;
      },
      error: (err) => {
        console.error('Failed to load log files', err);
        this.loadingFiles = false;
      }
    });
  }

  selectFile(filename: string, resetPage = true) {
    this.selectedFile = filename;
    this.loadingLogs = true;
    this.expandedLogIndex = null;

    if (resetPage) {
      this.page = 1;
      this.searchQuery = '';
      this.selectedLevel = 'ALL';
    }

    const params = {
      page: this.page.toString(),
      per_page: this.perPage.toString(),
      level: this.selectedLevel,
      search: this.searchQuery
    };

    this.http.get<any>(`${environment.apiUrl}/admin/logs/${filename}`, { params }).subscribe({
      next: (res) => {
        this.parsedLogs = res.data.logs || [];
        
        const pagination = res.data.pagination;
        if (pagination) {
          this.page = pagination.current_page;
          this.lastPage = pagination.last_page;
          this.perPage = pagination.per_page;
          this.totalEntries = pagination.total;
        }

        this.loadingLogs = false;
      },
      error: (err) => {
        console.error('Failed to load logs', err);
        this.loadingLogs = false;
      }
    });
  }

  onFilterChange() {
    if (this.selectedFile) {
      this.page = 1;
      this.selectFile(this.selectedFile, false);
    }
  }

  onPageChange(newPage: number) {
    if (this.selectedFile && newPage >= 1 && newPage <= this.lastPage) {
      this.page = newPage;
      this.selectFile(this.selectedFile, false);
    }
  }

  closeLogs() {
    this.selectedFile = null;
    this.parsedLogs = [];
    this.expandedLogIndex = null;
  }

  toggleStackTrace(index: number) {
    this.expandedLogIndex = this.expandedLogIndex === index ? null : index;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
}
