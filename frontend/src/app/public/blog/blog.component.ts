import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogPostService } from '../../core/services/blog-post.service';
import { BlogPost } from '../../core/models/models';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private postService = inject(BlogPostService);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);
  backendUrl = environment.backendUrl;
  
  posts = signal<BlogPost[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');

  ngOnInit() {
    const siteName = this.settingService.getSetting('site_name') || 'CRETE Developments';
    this.seoService.updateTitle(`Blog | ${siteName}`);
    
    this.status.set('loading');
    this.postService.getPublic({ status: 1 }).subscribe({
      next: (res) => {
        const paginatedData = res.data as any;
        this.posts.set(Array.isArray(paginatedData) ? paginatedData : (paginatedData?.data || []));
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return this.backendUrl + (imagePath.startsWith('/') ? '' : '/') + imagePath;
  }

  stripHtml(html: string | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
