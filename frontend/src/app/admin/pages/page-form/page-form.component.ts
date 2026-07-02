import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageService } from '../../../core/services/page.service';
import { Page } from '../../../core/models/models';
import { QuillModule } from 'ngx-quill';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-page-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, QuillModule],
  templateUrl: './page-form.component.html'
})
export class PageFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pageService = inject(PageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  pageForm!: FormGroup;
  isEditMode = false;
  pageId: number | null = null;
  isLoading = false;
  isSaving = false;
  slugManuallyEdited = false;

  // Quill config
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  ngOnInit() {
    this.initForm();
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.pageId = +idParam;
      this.loadPage(this.pageId);
    }

    // Auto-generate slug from English title
    this.pageForm.get('title_en')?.valueChanges.subscribe(title => {
      if (!this.isEditMode && !this.slugManuallyEdited && title) {
        this.pageForm.patchValue({
          slug: this.generateSlug(title)
        }, { emitEvent: false });
      }
    });

    this.pageForm.get('slug')?.valueChanges.subscribe(() => {
      this.slugManuallyEdited = true;
    });
  }

  blocks: any[] = [];

  private initForm() {
    this.pageForm = this.fb.group({
      title_ar: ['', Validators.required],
      title_en: ['', Validators.required],
      slug: ['', Validators.required],
      content_ar: [''],
      content_en: [''],
      status: [true],
      meta_fields: this.fb.group({
        layout: ['default'],
        show_title: [true],
        padding: ['medium'],
        bg_color: ['#ffffff'],
        show_in_navbar: [true],
        show_in_footer: [true],
        editor_mode: ['standard'], // 'standard' or 'builder'
        blocks: [[]]
      })
    });
  }

  private loadPage(id: number) {
    this.isLoading = true;
    this.pageService.getById(id).subscribe({
      next: (res: any) => {
        const p = res.data;
        const meta = p.meta_fields || {};
        const editorMode = meta.editor_mode || 'standard';
        this.blocks = meta.blocks || [];

        this.pageForm.patchValue({
          title_ar: p.title_ar,
          title_en: p.title_en,
          slug: p.slug,
          content_ar: p.content_ar || '',
          content_en: p.content_en || '',
          status: !!p.status,
          meta_fields: {
            layout: meta.layout || 'default',
            show_title: meta.show_title !== false,
            padding: meta.padding || 'medium',
            bg_color: meta.bg_color || '#ffffff',
            show_in_navbar: meta.show_in_navbar !== false,
            show_in_footer: meta.show_in_footer !== false,
            editor_mode: editorMode,
            blocks: this.blocks
          }
        });

        // System page protection: disable fields
        if (p.slug === 'home' || p.slug === 'contact-us' || p.slug === 'about-us') {
          this.pageForm.get('slug')?.disable();
        }
        if (p.slug === 'contact-us' || p.slug === 'about-us') {
          this.pageForm.get('status')?.disable();
        }

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading page details:', err);
        this.toastService.error('Failed to load page details.');
        this.router.navigate(['/admin/pages']);
      }
    });
  }

  get editorMode(): string {
    return this.pageForm.get('meta_fields.editor_mode')?.value || 'standard';
  }

  setEditorMode(mode: 'standard' | 'builder') {
    this.pageForm.get('meta_fields.editor_mode')?.setValue(mode);
  }

  addBlock(type: string) {
    let block: any = { type, collapsed: false };
    if (type === 'hero') {
      block = {
        ...block,
        title_en: '',
        title_ar: '',
        subtitle_en: '',
        subtitle_ar: '',
        bg_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        overlay_opacity: 0.4,
        btn_text_en: '',
        btn_text_ar: '',
        btn_link: ''
      };
    } else if (type === 'content') {
      block = {
        ...block,
        content_en: '',
        content_ar: ''
      };
    } else if (type === 'split') {
      block = {
        ...block,
        title_en: '',
        title_ar: '',
        text_en: '',
        text_ar: '',
        media_type: 'image',
        media_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        layout: 'left',
        btn_text_en: '',
        btn_text_ar: '',
        btn_link: ''
      };
    } else if (type === 'features') {
      block = {
        ...block,
        title_en: 'Our Values',
        title_ar: 'قيمنا ورسالتنا',
        subtitle_en: 'Pioneering spaces built on trust',
        subtitle_ar: 'مساحات رائدة مبنية على الثقة والتميز',
        items: [
          { title_en: 'Premium Quality', title_ar: 'جودة ممتازة', desc_en: 'Crafted with premium materials.', desc_ar: 'مصنوع من مواد فاخرة وممتازة.', icon: 'award' },
          { title_en: 'Safe Investment', title_ar: 'استثمار آمن', desc_en: 'Highest return on investments guaranteed.', desc_ar: 'أعلى عائد على الاستثمار مضمون.', icon: 'shield' }
        ]
      };
    } else if (type === 'projects') {
      block = {
        ...block,
        title_en: 'Featured Projects',
        title_ar: 'المشاريع المتميزة',
        limit: 3,
        style: 'grid'
      };
    } else if (type === 'faq') {
      block = {
        ...block,
        title_en: 'FAQ',
        title_ar: 'الأسئلة الشائعة',
        items: [
          { q_en: 'What is the payment plan?', q_ar: 'ما هي خطة الدفع؟', a_en: 'We offer flexible payment plans up to 7 years.', a_ar: 'نقدم خطط دفع مرنة تصل إلى 7 سنوات.' }
        ]
      };
    } else if (type === 'contact') {
      block = {
        ...block,
        title_en: 'Contact Us',
        title_ar: 'اتصل بنا',
        desc_en: 'We combine decades of expertise with an unwavering commitment to luxury, trust, and client success.',
        desc_ar: 'نحن نجمع بين عقود من الخبرة والتزام راسخ بالفخامة والثقة ونجاح عملائنا.',
        show_form: true,
        show_details: true,
        fields: [
          { name: 'name', type: 'text', label_en: 'Full Name', label_ar: 'الاسم الكامل', required: true },
          { name: 'phone', type: 'tel', label_en: 'Phone Number', label_ar: 'رقم الهاتف', required: true },
          { name: 'email', type: 'email', label_en: 'Email Address', label_ar: 'البريد الإلكتروني', required: false },
          { name: 'message', type: 'textarea', label_en: 'Message', label_ar: 'الرسالة', required: false }
        ]
      };
    }
    this.blocks.push(block);
    this.syncBlocks();
  }

  removeBlock(index: number) {
    if (confirm('Are you sure you want to remove this section?')) {
      this.blocks.splice(index, 1);
      this.syncBlocks();
    }
  }

  moveBlockUp(index: number) {
    if (index > 0) {
      const temp = this.blocks[index];
      this.blocks[index] = this.blocks[index - 1];
      this.blocks[index - 1] = temp;
      this.syncBlocks();
    }
  }

  moveBlockDown(index: number) {
    if (index < this.blocks.length - 1) {
      const temp = this.blocks[index];
      this.blocks[index] = this.blocks[index + 1];
      this.blocks[index + 1] = temp;
      this.syncBlocks();
    }
  }

  toggleCollapse(index: number) {
    this.blocks[index].collapsed = !this.blocks[index].collapsed;
  }

  addFeatureItem(blockIndex: number) {
    if (!this.blocks[blockIndex].items) {
      this.blocks[blockIndex].items = [];
    }
    this.blocks[blockIndex].items.push({
      title_en: '',
      title_ar: '',
      desc_en: '',
      desc_ar: '',
      icon: 'star'
    });
    this.syncBlocks();
  }

  removeFeatureItem(blockIndex: number, itemIndex: number) {
    this.blocks[blockIndex].items.splice(itemIndex, 1);
    this.syncBlocks();
  }

  addFaqItem(blockIndex: number) {
    if (!this.blocks[blockIndex].items) {
      this.blocks[blockIndex].items = [];
    }
    this.blocks[blockIndex].items.push({
      q_en: '',
      q_ar: '',
      a_en: '',
      a_ar: ''
    });
    this.syncBlocks();
  }

  removeFaqItem(blockIndex: number, itemIndex: number) {
    this.blocks[blockIndex].items.splice(itemIndex, 1);
    this.syncBlocks();
  }

  addContactField(blockIndex: number) {
    if (!this.blocks[blockIndex].fields) {
      this.blocks[blockIndex].fields = [];
    }
    const id = Math.random().toString(36).substring(2, 6);
    this.blocks[blockIndex].fields.push({
      name: 'field_' + id,
      type: 'text',
      label_en: 'New Field',
      label_ar: 'حقل جديد',
      required: false
    });
    this.syncBlocks();
  }

  removeContactField(blockIndex: number, fieldIndex: number) {
    this.blocks[blockIndex].fields.splice(fieldIndex, 1);
    this.syncBlocks();
  }

  syncBlocks() {
    this.pageForm.get('meta_fields.blocks')?.setValue(this.blocks);
  }

  private generateSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  onSubmit() {
    if (this.pageForm.invalid) {
      this.pageForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const body = { ...this.pageForm.getRawValue() };

    const request$ = this.isEditMode && this.pageId
      ? this.pageService.update(this.pageId, body)
      : this.pageService.create(body);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('Page saved successfully.');
        this.router.navigate(['/admin/pages']);
      },
      error: (err: any) => {
        this.isSaving = false;
        console.error('Error saving page', err);
        this.toastService.error(err?.error?.message || 'Error occurred while saving the page.');
      }
    });
  }
}
