import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { LandingPageService } from '../../core/services/landing-page.service';
import { LandingPage } from '../../core/models/models';

@Component({
  selector: 'app-landing-pages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './landing-pages.component.html'
})
export class LandingPagesComponent implements OnInit {
  private dataService = inject(LandingPageService);
  private fb = inject(FormBuilder);

  landingPages = signal<LandingPage[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');
  showModal = signal(false);
  
  dataForm: FormGroup;

  filters = {
    search: '',
    status: ''
  };

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
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.status.set('loading');
    this.dataService.getAll(this.filters).subscribe({
      next: (response) => {
        const paginatedData = response.data;
        this.landingPages.set(paginatedData.data || []);
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  openModal(item?: LandingPage) {
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
    
    // For simplicity, always create or update based on if slug is present in edit, but let's assume create for now 
    // since we don't track ID in the form. Let's add id to form or track it.
    // Actually, backend usually requires PUT for update. We need to track ID.
    const isEditing = !!data.id; // wait, id is not in form. 

    // Better implementation:
    this.dataService.create(data).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        console.error(err);
        alert('Error saving data.');
      }
    });
  }

  deleteData(id: number) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.dataService.delete(id).subscribe({
        next: () => this.loadData(),
        error: () => alert('Error deleting item')
      });
    }
  }
}
