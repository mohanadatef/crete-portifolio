import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { QuillModule } from 'ngx-quill';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-pages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HasPermissionDirective, QuillModule],
  templateUrl: './pages.component.html'
})
export class PagesComponent implements OnInit {
  private dataService = inject(PageService);
  private fb = inject(FormBuilder);

  pages = signal<Page[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');
  showModal = signal(false);
  
  dataForm: FormGroup;

  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  totalRecords = 0;

  filters = {
    search: '',
    status: ''
  };

  searchSubject = new Subject<string>();

  constructor() {
    this.dataForm = this.fb.group({
      id: [null],
      title_ar: ['', Validators.required],
      title_en: ['', Validators.required],
      slug: ['', Validators.required],
      content_ar: ['', Validators.required],
      content_en: ['', Validators.required],
      status: [true],
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((searchValue) => {
      this.filters.search = searchValue;
      this.loadData(1);
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  ngOnInit() {
    this.loadData(1);
  }

  loadData(page: number = 1) {
    this.status.set('loading');
    const params = {
      ...this.filters,
      page: page,
      per_page: this.perPage
    };
    this.dataService.getAll(params).subscribe({
      next: (response) => {
        const paginatedData = response.data as any;
        this.pages.set(paginatedData.data || []);
        this.currentPage = paginatedData.meta?.current_page || paginatedData.current_page || 1;
        this.lastPage = paginatedData.meta?.last_page || paginatedData.last_page || 1;
        this.totalRecords = paginatedData.meta?.total || paginatedData.total || 0;
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.loadData(page);
    }
  }

  changePerPage(event: any) {
    this.perPage = parseInt(event.target.value, 10);
    this.loadData(1);
  }

  openModal(item?: Page) {
    if (item) {
      this.dataForm.patchValue({
        ...item,
        status: !!item.status
      });
    } else {
      this.dataForm.reset({
        status: true
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveData() {
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      return;
    }

    const formValues = this.dataForm.value;
    const data: any = {};
    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== null && formValues[key] !== undefined) {
        data[key] = formValues[key];
      }
    });
    
    const isEditing = !!data.id;

    if (isEditing) {
      this.dataService.update(data.id, data).subscribe({
        next: () => {
          this.closeModal();
          this.loadData(this.currentPage);
        },
        error: (err) => {
          console.error(err);
          alert('Error updating page.');
        }
      });
    } else {
      this.dataService.create(data).subscribe({
        next: () => {
          this.closeModal();
          this.loadData(1);
        },
        error: (err) => {
          console.error(err);
          alert('Error creating page.');
        }
      });
    }
  }

  deleteData(id: number) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.dataService.delete(id).subscribe({
        next: () => this.loadData(this.currentPage),
        error: () => alert('Error deleting item')
      });
    }
  }
}
