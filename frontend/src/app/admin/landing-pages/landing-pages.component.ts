import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LandingPageService } from '../../core/services/landing-page.service';
import { ProjectService } from '../../core/services/project.service';
import { MediaService } from '../../core/services/media.service';
import { LandingPage, Project } from '../../core/models/models';
import { QuillModule } from 'ngx-quill';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

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
  selector: 'app-landing-pages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuillModule, HasPermissionDirective],
  templateUrl: './landing-pages.component.html'
})
export class LandingPagesComponent implements OnInit {
  private dataService = inject(LandingPageService);
  private projectService = inject(ProjectService);
  private mediaService = inject(MediaService);
  private fb = inject(FormBuilder);
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  currentUploadTarget: { col: LayoutBlock } | null = null;

  landingPages = signal<LandingPage[]>([]);
  projects = signal<Project[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');
  showModal = signal(false);
  showLogsModal = signal(false);
  logsData = signal<any[]>([]);
  logsLoading = signal(false);
  editingHasLeads = signal(false);
  originalFieldNames = new Set<string>();
  copiedSlug = signal('');
  activeTab = signal<'general' | 'layout' | 'form'>('general');
  
  // Layout Builder State
  layoutRows = signal<LayoutRow[]>([]);
  
  // Form Builder State
  formFields = signal<FormField[]>([]);
  
  dataForm: FormGroup;

  filters: any = {
    search: '',
    status: '',
    project_id: '',
    page: 1,
    per_page: 10
  };

  pagination = signal({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  searchSubject = new Subject<string>();

  toasts = signal<{id: number, message: string, type: 'success' | 'error'}[]>([]);
  toastIdCounter = 0;

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = ++this.toastIdCounter;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => {
      this.toasts.update(t => t.filter(toast => toast.id !== id));
    }, 4000);
  }

  constructor() {
    this.dataForm = this.fb.group({
      id: [null],
      title_ar: ['', Validators.required],
      title_en: ['', Validators.required],
      slug: ['', Validators.required],
      content_ar: [''],
      content_en: [''],
      project_id: [null],
      status: [true],
      show_header_footer: [true],
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((searchValue) => {
      this.filters.search = searchValue;
      this.filters.page = 1;
      this.loadData();
    });
  }

  ngOnInit() {
    this.loadData();
    this.loadProjects();
  }

  loadProjects() {
    this.projectService.getAll({ per_page: 1000 }).subscribe({
      next: (res) => {
        const p = res.data?.data || res.data || [];
        this.projects.set(p);
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadData();
  }

  onPerPageChange(event: Event) {
    this.filters.per_page = Number((event.target as HTMLSelectElement).value);
    this.filters.page = 1;
    this.loadData();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination().last_page) {
      this.filters.page = page;
      this.loadData();
    }
  }

  copyLink(slug: string) {
    const url = `${window.location.origin}/landing/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedSlug.set(slug);
      this.showToast('Link copied to clipboard!', 'success');
      setTimeout(() => this.copiedSlug.set(''), 2000);
    });
  }

  previewPage(slug: string) {
    window.open(`/landing/${slug}`, '_blank');
  }

  loadData() {
    this.status.set('loading');
    this.dataService.getAll(this.filters).subscribe({
      next: (response) => {
        const paginatedData = response.data;
        this.landingPages.set(paginatedData.data || paginatedData || []);
        if (paginatedData.current_page) {
          this.pagination.set({
            current_page: paginatedData.current_page,
            last_page: paginatedData.last_page,
            per_page: paginatedData.per_page,
            total: paginatedData.total
          });
        }
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  isFieldProtected(fieldName: string): boolean {
    return this.editingHasLeads() && this.originalFieldNames.has(fieldName);
  }

  openModal(item?: LandingPage) {
    this.activeTab.set('general');
    this.originalFieldNames.clear();
    
    if (item) {
      this.dataForm.patchValue({
        ...item,
        status: !!item.status,
        show_header_footer: item.show_header_footer !== undefined ? !!item.show_header_footer : true
      });
      this.layoutRows.set(item.layout ? JSON.parse(JSON.stringify(item.layout)) : []);
      const schema = item.form_schema ? JSON.parse(JSON.stringify(item.form_schema)) : [];
      this.formFields.set(schema);
      schema.forEach((field: FormField) => {
        if (field.name) {
          this.originalFieldNames.add(field.name);
        }
      });
      // Check if this landing page has any leads submitted
      this.editingHasLeads.set(false);
      this.dataService.getById(item.id).subscribe({
        next: (res: any) => {
          const page = res.data;
          if (page?.leads_count && page.leads_count > 0) {
            this.editingHasLeads.set(true);
          }
        }
      });
    } else {
      this.editingHasLeads.set(false);
      this.dataForm.reset({
        status: true,
        show_header_footer: true,
        project_id: ''
      });
      this.layoutRows.set([]);
      this.formFields.set([]);
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  // Layout Row Reordering
  moveRowUp(index: number) {
    if (index <= 0) return;
    this.layoutRows.update(rows => {
      const newRows = [...rows];
      [newRows[index - 1], newRows[index]] = [newRows[index], newRows[index - 1]];
      return newRows;
    });
  }

  moveRowDown(index: number) {
    const rows = this.layoutRows();
    if (index >= rows.length - 1) return;
    this.layoutRows.update(r => {
      const newRows = [...r];
      [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
      return newRows;
    });
  }

  // Form Field Reordering
  moveFieldUp(index: number) {
    if (index <= 0) return;
    this.formFields.update(fields => {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      return newFields;
    });
  }

  moveFieldDown(index: number) {
    const fields = this.formFields();
    if (index >= fields.length - 1) return;
    this.formFields.update(f => {
      const newFields = [...f];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return newFields;
    });
  }

  // Layout Builder Methods
  addRow(columnsCount: number) {
    const cols: LayoutBlock[] = [];
    for(let i=0; i<columnsCount; i++) {
       cols.push({ type: 'text', content: '' });
    }
    this.layoutRows.update(rows => [...rows, { columns: cols }]);
  }

  removeRow(index: number) {
    this.layoutRows.update(rows => {
      const newRows = [...rows];
      newRows.splice(index, 1);
      return newRows;
    });
  }

  // Form Builder Methods
  addField() {
    this.formFields.update(f => [...f, {
       name: 'field_' + Math.floor(Math.random()*1000),
       label_en: 'New Field',
       label_ar: 'حقل جديد',
       type: 'text',
       required: false,
       options: ''
    }]);
  }

  removeField(index: number) {
    this.formFields.update(f => {
       const newF = [...f];
       newF.splice(index, 1);
       return newF;
    });
  }

  saveData() {
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      this.showToast('Please check the general info form for errors.', 'error');
      return;
    }

    const formValues = this.dataForm.value;
    const data: any = {};
    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== null && formValues[key] !== undefined) {
        data[key] = formValues[key];
      }
    });

    data.layout = this.layoutRows();
    data.form_schema = this.formFields();
    
    const isEditing = !!data.id;

    if (isEditing) {
      this.dataService.update(data.id, data).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
          this.showToast('Landing Page updated successfully', 'success');
        },
        error: (err) => {
          let msg = err.error?.message || 'Error saving data';
          if (err.error?.errors) {
            const errors = Object.values(err.error.errors) as string[][];
            msg = errors[0]?.[0] || msg;
          }
          this.showToast(msg, 'error');
        }
      });
    } else {
      this.dataService.create(data).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
          this.showToast('Landing Page created successfully', 'success');
        },
        error: (err) => {
          let msg = err.error?.message || 'Error saving data';
          if (err.error?.errors) {
            const errors = Object.values(err.error.errors) as string[][];
            msg = errors[0]?.[0] || msg;
          }
          this.showToast(msg, 'error');
        }
      });
    }
  }

  triggerUpload(col: LayoutBlock) {
    this.currentUploadTarget = { col };
    this.fileInput.nativeElement.click();
  }

  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file && this.currentUploadTarget) {
      this.status.set('loading');
      this.mediaService.upload(file).subscribe({
        next: (res: any) => {
          if (this.currentUploadTarget) {
             this.currentUploadTarget.col.url = res.url || res.data?.url;
          }
          this.status.set('success');
          this.showToast('File uploaded successfully', 'success');
          this.fileInput.nativeElement.value = '';
        },
        error: () => {
          this.status.set('success');
          this.showToast('Error uploading file', 'error');
          this.fileInput.nativeElement.value = '';
        }
      });
    }
  }

  deleteData(id: number) {
    if (confirm('Are you sure you want to delete this landing page?')) {
      this.dataService.delete(id).subscribe({
        next: () => {
          this.loadData();
          this.showToast('Landing Page deleted successfully', 'success');
        },
        error: (err) => {
          const msg = err.error?.message || 'Error deleting item';
          this.showToast(msg, 'error');
        }
      });
    }
  }

  openLogs(id: number) {
    this.logsLoading.set(true);
    this.logsData.set([]);
    this.showLogsModal.set(true);
    this.dataService.getLogs(id).subscribe({
      next: (res: any) => {
        this.logsData.set(res.data || []);
        this.logsLoading.set(false);
      },
      error: () => {
        this.logsLoading.set(false);
        this.showToast('Failed to load activity logs', 'error');
      }
    });
  }

  closeLogs() {
    this.showLogsModal.set(false);
    this.logsData.set([]);
  }
}
