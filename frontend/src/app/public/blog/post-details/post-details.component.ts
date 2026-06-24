import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlogPostService } from '../../../core/services/blog-post.service';
import { BlogPost } from '../../../core/models/models';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { SeoService } from '../../../services/seo.service';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './post-details.component.html',
  styleUrl: './post-details.component.scss'
})
export class BlogPostDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(BlogPostService);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);

  post = signal<BlogPost | null>(null);
  status = signal<'loading' | 'success' | 'error'>('loading');
  backendUrl = environment.backendUrl;
  
  private langChangeSub?: Subscription;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadPost(slug);
      } else {
        this.status.set('error');
      }
    });

    // Listen to language changes to update SEO tags dynamically
    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      this.updateSeoTags();
    });
  }

  ngOnDestroy() {
    if (this.langChangeSub) {
      this.langChangeSub.unsubscribe();
    }
  }

  private loadPost(slug: string) {
    this.status.set('loading');
    this.postService.getPublicBySlug(slug).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.post.set(res.data);
          this.status.set('success');
          this.updateSeoTags();
        } else {
          this.status.set('error');
        }
      },
      error: (err) => {
        console.error('Error loading blog post details:', err);
        this.status.set('error');
      }
    });
  }

  private updateSeoTags() {
    const p = this.post();
    if (!p) return;

    const isAr = this.translate.currentLang() === 'ar';
    const title = isAr ? (p.title_ar || p.title_en) : (p.title_en || p.title_ar);
    const content = isAr ? (p.content_ar || p.content_en) : (p.content_en || p.content_ar);
    
    // Strip HTML tags for meta description and take first 150 characters
    const cleanDesc = content ? content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '';

    this.seoService.updateTitle(title);
    if (cleanDesc) {
      this.seoService.updateMeta('description', cleanDesc);
    }
    if (p.image) {
      this.seoService.updateOgImage(this.getImageUrl(p.image));
    }
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
}
