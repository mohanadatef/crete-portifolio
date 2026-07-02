import { Component, inject, OnInit, signal } from '@angular/core';
import { LeadService } from '../../services/lead.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslatePipe, TranslateDirective, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  private leadService = inject(LeadService);
  private route = inject(ActivatedRoute);
  private pageService = inject(PageService);
  public translate = inject(TranslateService);
  private seoService = inject(SeoService);
  private settingService = inject(SettingService);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  
  page = signal<Page | null>(null);
  isLoadingPage = signal<boolean>(true);
  projects = signal<any[]>([]);
  siteBranches = signal<any[]>([]);

  formData: any = {};
  
  utmParams: any = {};
  projectId: number | null = null;
  recaptchaSiteKey = '';
  consentGiven: boolean = false;
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';

  getMeta(page: Page | null, key: string, defaultValue: any): any {
    if (!page || !page.meta_fields) return defaultValue;
    const val = page.meta_fields[key];
    return val !== undefined && val !== null ? val : defaultValue;
  }

  getEditorMode(page: Page | null): string {
    return this.getMeta(page, 'editor_mode', 'standard');
  }

  getBlocks(page: Page | null): any[] {
    return this.getMeta(page, 'blocks', []);
  }

  getPrimaryImagePath(project: any): string | null {
    if (!project.images || project.images.length === 0) return null;
    const primary = project.images.find((img: any) => img.is_primary);
    return primary ? primary.image_path : project.images[0].image_path;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.utmParams = {
        utm_source: params['utm_source'] || null,
        utm_medium: params['utm_medium'] || null,
        utm_campaign: params['utm_campaign'] || null,
        utm_content: params['utm_content'] || null,
      };
      if (params['project']) {
        this.projectId = +params['project'];
      }
    });

    this.settingService.getPublicSettings().subscribe(settings => {
      const data = settings?.data || settings;
      if (data) {
        const siteName = data['site_name'] || 'CRETE Developments';
        this.seoService.updateTitle(`Contact Us | ${siteName}`);
        
        if (data['company_branches']) {
          try {
            this.siteBranches.set(JSON.parse(data['company_branches']));
          } catch (e) {}
        }
        
        // Dynamically load Recaptcha
        this.recaptchaSiteKey = data['recaptcha_site_key'] || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
        this.loadRecaptchaScript(this.recaptchaSiteKey);
      }
    });

    this.loadPageContent();
  }

  loadRecaptchaScript(siteKey: string) {
    if (typeof window === 'undefined') return;
    const id = 'recaptcha-dyn-script';
    if (document.getElementById(id)) return;
    
    const script = document.createElement('script');
    script.id = id;
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  loadPageContent() {
    this.pageService.getPublicBySlug('contact-us').subscribe({
      next: (res) => {
        this.page.set(res.data);
        this.isLoadingPage.set(false);

        const blocks = this.getBlocks(res.data);
        if (blocks.some((b: any) => b.type === 'projects')) {
          this.loadProjects();
        }
      },
      error: () => {
        this.isLoadingPage.set(false);
      }
    });
  }

  loadProjects() {
    this.http.get<any>(`${environment.apiUrl}/public/projects`).subscribe({
      next: (response) => {
        const paginatedData = response.data || {};
        const projectsArray = paginatedData.data || response || [];
        this.projects.set(Array.isArray(projectsArray) ? projectsArray : []);
      },
      error: (err) => console.error('Error loading projects block data:', err)
    });
  }

  onSubmit() {
    this.status = 'loading';
    const siteKey = this.recaptchaSiteKey || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    
    if (typeof window !== 'undefined' && (window as any).grecaptcha) {
      (window as any).grecaptcha.ready(() => {
        (window as any).grecaptcha.execute(siteKey, {action: 'submit'}).then((token: string) => {
          this.submitData(token);
        }).catch(() => {
          this.status = 'error';
          this.toastService.error('Security check failed. Please check your configuration.');
        });
      });
    } else {
      // Fallback
      this.submitData('dev_bypass_token');
    }
  }

  private submitData(recaptchaToken: string) {
    const payload = {
      ...this.formData,
      ...this.utmParams,
      project_id: this.projectId,
      recaptcha_token: recaptchaToken
    };

    this.leadService.submitLead(payload).subscribe({
      next: (res: any) => {
        this.status = 'success';
        this.formData = {};
        this.toastService.success(this.translate.currentLang() === 'ar' ? 'تم إرسال طلبك بنجاح وسنتصل بك قريباً!' : 'Thank you! Your inquiry was sent successfully.');

        // MKT-01: Trigger GTM Event for Conversion Tracking
        if (typeof window !== 'undefined') {
          if ((window as any).dataLayer) {
            (window as any).dataLayer.push({
              'event': 'lead_submission_success',
              'lead_id': res?.lead?.id || 'unknown'
            });
          }
          const conversionId = this.settingService.getSetting('google_conversion_id') || 
                               (environment as any).googleConversionId || 
                               this.settingService.getSetting('google_tag');
          if (conversionId && conversionId !== 'AW-XX' && typeof (window as any).gtag === 'function') {
            const sendTo = conversionId.includes('/') ? conversionId : `${conversionId}/lead`;
            (window as any).gtag('event', 'conversion', { 'send_to': sendTo });
          }
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'Lead');
          }
        }
      },
      error: () => {
        this.status = 'error';
        this.toastService.error(this.translate.currentLang() === 'ar' ? 'فشل إرسال الطلب، يرجى المحاولة لاحقاً.' : 'Failed to send inquiry. Please try again.');
      }
    });
  }
}
