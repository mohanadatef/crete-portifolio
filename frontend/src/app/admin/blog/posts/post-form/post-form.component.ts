import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlogPostService } from '../../../../core/services/blog-post.service';
import { BlogCategoryService } from '../../../../core/services/blog-category.service';
import { MediaService } from '../../../../core/services/media.service';
import { BlogCategory, BlogPost } from '../../../../core/models/models';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-blog-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, QuillModule],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.scss'
})
export class BlogPostFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private postService = inject(BlogPostService);
  private categoryService = inject(BlogCategoryService);
  private mediaService = inject(MediaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  postForm!: FormGroup;
  isEditMode = false;
  postId: number | null = null;
  isLoading = false;
  isSaving = false;
  categories = signal<BlogCategory[]>([]);
  slugManuallyEdited = false;

  // Cover image tracking
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  existingImage: string | null = null;

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
    this.loadCategories();
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.postId = +idParam;
      this.loadBlogPost(this.postId);
    }

    // Auto-generate slug from English title
    this.postForm.get('title_en')?.valueChanges.subscribe(title => {
      if (!this.isEditMode && !this.slugManuallyEdited && title) {
        this.postForm.patchValue({
          slug: this.generateSlug(title)
        }, { emitEvent: false });
      }
    });

    this.postForm.get('slug')?.valueChanges.subscribe(() => {
      this.slugManuallyEdited = true;
    });
  }

  private initForm() {
    this.postForm = this.fb.group({
      title_ar: ['', Validators.required],
      title_en: ['', Validators.required],
      slug: ['', Validators.required],
      content_ar: [''],
      content_en: [''],
      blog_category_id: [null, Validators.required],
      status: [true]
    });
  }

  private loadCategories() {
    this.categoryService.getPublic().subscribe({
      next: (res) => {
        const categoriesList = res.data;
        const list = Array.isArray(categoriesList) 
          ? categoriesList 
          : ((categoriesList as any)?.data || []);
        this.categories.set(list);
      },
      error: (err) => console.error('Error loading blog categories', err)
    });
  }

  private loadBlogPost(id: number) {
    this.isLoading = true;
    this.postService.getById(id).subscribe({
      next: (res) => {
        const p = res.data;
        this.postForm.patchValue({
          title_ar: p.title_ar,
          title_en: p.title_en,
          slug: p.slug,
          content_ar: p.content_ar || '',
          content_en: p.content_en || '',
          blog_category_id: p.blog_category_id || null,
          status: !!p.status
        });

        if (p.category) {
          const catExists = this.categories().some(c => c.id === p.category!.id);
          if (!catExists) {
            this.categories.update(cats => [...cats, p.category!]);
          }
        }

        if (p.image) {
          this.existingImage = p.image;
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading blog post', err);
        alert('Failed to load blog post details.');
        this.router.navigate(['/admin/blog/posts']);
      }
    });
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

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  removeExistingImage() {
    this.existingImage = null;
  }

  onSubmit() {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const body = { ...this.postForm.value };

    // If there is a new file to upload first
    if (this.selectedFile) {
      this.mediaService.upload(this.selectedFile).subscribe({
        next: (res) => {
          body.image = res.data.url; // Use uploaded URL
          this.savePostData(body);
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Error uploading media', err);
          alert('Failed to upload cover image.');
        }
      });
    } else {
      body.image = this.existingImage;
      this.savePostData(body);
    }
  }

  private savePostData(body: any) {
    // Backend expects status as boolean, which is fine.
    const request$ = this.isEditMode && this.postId
      ? this.postService.update(this.postId, body)
      : this.postService.create(body);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/admin/blog/posts']);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving post', err);
        alert(err?.error?.message || 'Error occurred while saving the post.');
      }
    });
  }
}
