import { Component, inject, OnInit, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { LayoutService } from '../../services/layout.service';

interface LayoutBlock {
  type: 'text' | 'image' | 'video' | 'form';
  content?: string;
  url?: string;
}

interface LayoutRow {
  columns: LayoutBlock[];
}

interface FormField {
  name: string;
  label_en: string;
  label_ar: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio';
  required: boolean;
  options?: string;
}

@Component({
  selector: 'app-public-landing-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landing-page.component.html'
})
export class PublicLandingPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  private layoutService = inject(LayoutService);
  public translate = inject(TranslateService);

  status = signal<'loading' | 'success' | 'error' | 'not-found'>('loading');
  submitStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  errorMessage = signal<string>('');
  pageData = signal<any>(null);
  
  layoutRows = computed(() => {
    const data = this.pageData();
    if (!data || !data.layout) return [];
    try {
      return typeof data.layout === 'string' ? JSON.parse(data.layout) : data.layout;
    } catch (e) {
      return [];
    }
  });

  formFields = computed(() => {
    const data = this.pageData();
    if (!data || !data.form_schema) return [];
    try {
      return typeof data.form_schema === 'string' ? JSON.parse(data.form_schema) : data.form_schema;
    } catch (e) {
      return [];
    }
  });

  dynamicForm!: FormGroup;
  slug: string = '';

  constructor() {
    effect(() => {
      if (this.pageData()) {
        this.buildForm();
      }
    });
  }

  ngOnInit() {
    this.layoutService.showHeaderFooter.set(false); // Hide by default while loading
    this.route.paramMap.subscribe(params => {
      this.slug = params.get('slug') || '';
      if (this.slug) {
        this.loadPageData();
      } else {
        this.status.set('not-found');
      }
    });
  }

  ngOnDestroy() {
    this.layoutService.showHeaderFooter.set(true); // Reset when leaving page
  }

  loadPageData() {
    this.status.set('loading');
    this.http.get(`${environment.apiUrl}/public/landing-pages/${this.slug}`).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.pageData.set(res.data);
          // Only show header/footer if explicitly enabled by the landing page
          this.layoutService.showHeaderFooter.set(!!res.data.show_header_footer);
          this.status.set('success');
        } else {
          this.status.set('not-found');
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.status.set('not-found');
        } else {
          this.status.set('error');
        }
      }
    });
  }

  buildForm() {
    const group: any = {};
    const fields: FormField[] = this.formFields();
    
    fields.forEach(field => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'email') {
        validators.push(Validators.email);
      }
      group[field.name] = new FormControl('', validators);
    });

    this.dynamicForm = this.fb.group(group);
  }

  getOptions(optionsString?: string): string[] {
    if (!optionsString) return [];
    return optionsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  sanitizeHtml(content?: string): SafeHtml {
    if (!content) return '';
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  submitForm() {
    if (this.dynamicForm.invalid) {
      this.dynamicForm.markAllAsTouched();
      return;
    }

    this.submitStatus.set('loading');
    this.errorMessage.set('');
    
    const formData = this.dynamicForm.value;

    this.http.post(`${environment.apiUrl}/public/landing-pages/${this.slug}/submit`, formData).subscribe({
      next: () => {
        this.submitStatus.set('success');
        this.router.navigate(['/landing', this.slug, 'thank-you']);
      },
      error: (err) => {
        console.error(err);
        this.submitStatus.set('error');
        if (err.error?.errors) {
          const firstError = Object.values(err.error.errors)[0] as string[];
          this.errorMessage.set(firstError[0]);
        } else {
          this.errorMessage.set(err.error?.message || 'We couldn\'t process your request. Please review your information and try again.');
        }
      }
    });
  }
}
