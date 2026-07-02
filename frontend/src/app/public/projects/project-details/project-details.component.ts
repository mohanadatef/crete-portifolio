import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectImage } from '../../../core/models/models';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { SeoService } from '../../../services/seo.service';
import { SettingService } from '../../../services/setting.service';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);

  project = signal<Project | null>(null);
  status = signal<'loading' | 'success' | 'error'>('loading');
  backendUrl = environment.backendUrl;
  activeImage = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadProject(slug);
      } else {
        this.status.set('error');
      }
    });
  }

  loadProject(slug: string) {
    this.status.set('loading');
    this.projectService.getPublicBySlug(slug).subscribe({
      next: (res) => {
        if (res && res.data) {
          const p = res.data;
          this.project.set(p);
          this.status.set('success');
          
          const siteName = this.settingService.getSetting('site_name') || 'CRETE Developments';
          const projectTitle = this.translate.currentLang() === 'ar' ? (p.title_ar || p.title_en) : (p.title_en || p.title_ar);
          this.seoService.updateTitle(`${projectTitle} | ${siteName}`);
          
          const desc = this.translate.currentLang() === 'ar' ? p.description_ar : p.description_en;
          this.seoService.updateMeta('description', this.stripHtml(desc));
          
          // Set initial active image from primary or first image
          const primaryImg = p.images?.find((img: ProjectImage) => img.is_primary);
          const firstImg = p.images && p.images.length > 0 ? p.images[0] : null;
          const activeImgPath = primaryImg ? primaryImg.image_path : (firstImg ? firstImg.image_path : null);
          this.activeImage.set(activeImgPath);

          if (activeImgPath) {
            this.seoService.updateOgImage(this.getImageUrl(activeImgPath));
          }
        } else {
          this.status.set('error');
        }
      },
      error: (err) => {
        console.error('Error loading project details', err);
        this.status.set('error');
      }
    });
  }

  getPrimaryImagePath(project: Project): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find(img => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return this.backendUrl + (imagePath.startsWith('/') ? '' : '/') + imagePath;
  }

  stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim().substring(0, 160);
  }
}
