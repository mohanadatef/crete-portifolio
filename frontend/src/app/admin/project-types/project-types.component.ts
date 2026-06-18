import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-types.component.html',
  styleUrl: './project-types.component.scss'
})
export class ProjectTypesComponent implements OnInit {
  private http = inject(HttpClient);
  projectTypes: any[] = [];
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  
  formData: any = {
    name_ar: '',
    name_en: '',
    slug: '',
    is_active: true
  };

  ngOnInit() {
    this.loadProjectTypes();
  }

  loadProjectTypes() {
    this.http.get<any>('http://backend.test/api/v1/admin/project-types', {
      headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` }
    }).subscribe({
      next: (res) => {
        const paginatedData = res.data || {};
        const typesArray = paginatedData.data || res || [];
        this.projectTypes = Array.isArray(typesArray) ? typesArray : [];
      },
      error: (err) => console.error('Error loading project types', err)
    });
  }

  openModal() {
    this.isEditing = false;
    this.editingId = null;
    this.formData = {
      name_ar: '',
      name_en: '',
      slug: '',
      is_active: true
    };
    this.showModal = true;
  }

  editType(type: any) {
    this.isEditing = true;
    this.editingId = type.id;
    this.formData = {
      name_ar: type.name_ar,
      name_en: type.name_en,
      slug: type.slug,
      is_active: type.is_active
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveType() {
    const headers = { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` };
    const payload = {
      ...this.formData,
      is_active: this.formData.is_active ? 1 : 0
    };

    if (this.isEditing && this.editingId) {
      this.http.put(`http://backend.test/api/v1/admin/project-types/${this.editingId}`, payload, { headers }).subscribe({
        next: () => {
          this.closeModal();
          this.loadProjectTypes();
        },
        error: (err) => alert('Error updating project type')
      });
    } else {
      this.http.post('http://backend.test/api/v1/admin/project-types', payload, { headers }).subscribe({
        next: () => {
          this.closeModal();
          this.loadProjectTypes();
        },
        error: (err) => alert('Error creating project type')
      });
    }
  }

  deleteType(id: number) {
    if (confirm('Are you sure you want to delete this project type?')) {
      this.http.delete(`http://backend.test/api/v1/admin/project-types/${id}`, {
        headers: { Authorization: `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)}` }
      }).subscribe({
        next: () => this.loadProjectTypes(),
        error: (err) => alert('Error deleting project type')
      });
    }
  }
}
