import { Component, inject, OnInit, signal } from '@angular/core';
import { LeadService } from '../../services/lead.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { SeoService } from '../../services/seo.service';
import { SettingService } from '../../services/setting.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslatePipe, TranslateDirective],
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
  
  page = signal<Page | null>(null);
  isLoadingPage = signal<boolean>(true);

  formData = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };
  
  utmParams: any = {};
  projectId: number | null = null;
  recaptchaSiteKey = '';
  consentGiven: boolean = false;
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';

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
      },
      error: () => {
        this.isLoadingPage.set(false);
      }
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
          alert('Security check failed. Please check your configuration.');
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
        this.formData = { name: '', email: '', phone: '', message: '' };

        // MKT-01: Trigger GTM Event for Conversion Tracking
        if (typeof window !== 'undefined') {
          if ((window as any).dataLayer) {
            (window as any).dataLayer.push({
              'event': 'lead_submission_success',
              'lead_id': res?.lead?.id || 'unknown'
            });
          }
          if (typeof (window as any).gtag === 'function') {
            (window as any).gtag('event', 'conversion', { 'send_to': 'AW-XX/lead' });
          }
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'Lead');
          }
        }
      },
      error: () => {
        this.status = 'error';
      }
    });
  }
}
