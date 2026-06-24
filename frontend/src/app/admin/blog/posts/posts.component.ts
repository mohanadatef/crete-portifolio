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

  filters = {
    search: '',
    status: ''
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.status.set('loading');
    this.dataService.getAll(this.filters).subscribe({
      next: (response) => {
        const paginatedData = response.data;
        this.posts.set(paginatedData.data || []);
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  deleteData(id: number) {
    if (confirm('Are you sure you want to delete this blog post?')) {
      this.dataService.delete(id).subscribe({
        next: () => this.loadData(),
        error: () => alert('Error deleting blog post')
      });
    }
  }
}
