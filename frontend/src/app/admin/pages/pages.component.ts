import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-pages',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HasPermissionDirective],
  templateUrl: './pages.component.html'
})
export class PagesComponent implements OnInit {
  private dataService = inject(PageService);
  private router = inject(Router);

  pages = signal<Page[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');

  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  totalRecords = 0;

  filters = {
    search: '',
    status: ''
  };

  searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((searchValue) => {
      this.filters.search = searchValue;
      this.loadData(1);
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  ngOnInit() {
    this.loadData(1);
  }

  resetFilters() {
    this.filters = {
      search: '',
      status: ''
    };
    this.loadData(1);
  }

  loadData(page: number = 1) {
    this.status.set('loading');
    const params = {
      ...this.filters,
      page: page,
      per_page: this.perPage
    };
    this.dataService.getAll(params).subscribe({
      next: (response) => {
        const paginatedData = response.data as any;
        this.pages.set(paginatedData.data || []);
        this.currentPage = paginatedData.meta?.current_page || paginatedData.current_page || 1;
        this.lastPage = paginatedData.meta?.last_page || paginatedData.last_page || 1;
        this.totalRecords = paginatedData.meta?.total || paginatedData.total || 0;
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.loadData(page);
    }
  }

  changePerPage(event: any) {
    this.perPage = parseInt(event.target.value, 10);
    this.loadData(1);
  }

  openCreatePage() {
    this.router.navigate(['/admin/pages/create']);
  }

  openEditPage(id: number) {
    this.router.navigate(['/admin/pages/edit', id]);
  }

  deleteData(id: number) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.dataService.delete(id).subscribe({
        next: () => this.loadData(this.currentPage),
        error: () => alert('Error deleting item')
      });
    }
  }
}
