import { Component, inject, OnInit } from '@angular/core';
import { LeadService } from '../../services/lead.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  private leadService = inject(LeadService);
  private route = inject(ActivatedRoute);
  
  formData = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };
  
  utmParams: any = {};
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
    });
  }

  onSubmit() {
    this.status = 'loading';
    
    if (typeof window !== 'undefined' && (window as any).grecaptcha) {
      (window as any).grecaptcha.ready(() => {
        // REPLACE 'YOUR_REAL_RECAPTCHA_SITE_KEY' WITH YOUR ACTUAL RECAPTCHA V3 SITE KEY
        (window as any).grecaptcha.execute('YOUR_REAL_RECAPTCHA_SITE_KEY', {action: 'submit'}).then((token: string) => {
          this.submitData(token);
        });
      });
    } else {
      // Fallback if script didn't load - fail visibly instead of failing validation on backend
      this.status = 'error';
      alert('Security check failed to load. Please refresh the page or disable your adblocker and try again.');
    }
  }

  private submitData(recaptchaToken: string) {
    const payload = {
      ...this.formData,
      ...this.utmParams,
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
