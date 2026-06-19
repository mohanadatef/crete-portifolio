import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogPostService } from '../../core/services/blog-post.service';
import { BlogPost } from '../../core/models/models';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private postService = inject(BlogPostService);
  
  posts = signal<BlogPost[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');

  ngOnInit() {
    this.status.set('loading');
    this.postService.getAll({ status: 1 }).subscribe({
      next: (res) => {
        const paginatedData = res.data;
        this.posts.set(paginatedData.data || paginatedData || []);
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }
}
