import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BlogPostService } from '../../../core/services/blog-post.service';
import { BlogPost } from '../../../core/models/models';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './posts.component.html'
})
export class PostsComponent implements OnInit {
  private dataService = inject(BlogPostService);
  private toastService = inject(ToastService);

  backendUrl = environment.backendUrl;
  posts = signal<BlogPost[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');

  getPostImageUrl(imagePath: string | null): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return this.backendUrl + imagePath;
  }

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
        this.posts.set(paginatedData.data || []);
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

  deleteData(id: number) {
    if (confirm('Are you sure you want to delete this blog post?')) {
      this.dataService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Blog post deleted successfully.');
          this.loadData(this.currentPage);
        },
        error: () => this.toastService.error('Error deleting blog post')
      });
    }
  }
}
