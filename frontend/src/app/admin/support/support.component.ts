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
  filteredLogs: any[] = [];

  searchQuery = '';
  selectedLevel = 'ALL';
  expandedLogIndex: number | null = null;

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

  selectFile(filename: string) {
    this.selectedFile = filename;
    this.loadingLogs = true;
    this.parsedLogs = [];
    this.filteredLogs = [];
    this.expandedLogIndex = null;
    this.searchQuery = '';
    this.selectedLevel = 'ALL';

    this.http.get<any>(`${environment.apiUrl}/admin/logs/${filename}`).subscribe({
      next: (res) => {
        this.parsedLogs = res.data.logs || [];
        this.applyFilters();
        this.loadingLogs = false;
      },
      error: (err) => {
        console.error('Failed to load logs', err);
        this.loadingLogs = false;
      }
    });
  }

  closeLogs() {
    this.selectedFile = null;
    this.parsedLogs = [];
    this.filteredLogs = [];
    this.expandedLogIndex = null;
  }

  toggleStackTrace(index: number) {
    this.expandedLogIndex = this.expandedLogIndex === index ? null : index;
  }

  applyFilters() {
    this.filteredLogs = this.parsedLogs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                            log.stack_trace.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesLevel = this.selectedLevel === 'ALL' || log.level === this.selectedLevel;

      return matchesSearch && matchesLevel;
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Simple notification logic can be used here
  }
}
