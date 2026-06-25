import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BlogPostService } from '../../../core/services/blog-post.service';
import { BlogPost } from '../../../core/models/models';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './posts.component.html'
})
export class PostsComponent implements OnInit {
  private dataService = inject(BlogPostService);

  posts = signal<BlogPost[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');

  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  totalRecords = 0;

  filters = {
    search: '',
    status: ''
  };

  ngOnInit() {
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
        const paginatedData = response.data;
        this.posts.set(paginatedData.data || []);
        this.currentPage = paginatedData.current_page || 1;
        this.lastPage = paginatedData.last_page || 1;
        this.totalRecords = paginatedData.total || 0;
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
        next: () => this.loadData(this.currentPage),
        error: () => alert('Error deleting blog post')
      });
    }
  }
}
