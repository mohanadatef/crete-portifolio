import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private dataService = inject(UserService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
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
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: [''],
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
        this.users.set(paginatedData.data || paginatedData || []);
        this.status.set('success');
      },
      error: () => this.status.set('error')
    });
  }

  openModal(item?: User) {
    if (item) {
      this.dataForm.patchValue({
        ...item,
        status: item.is_active !== undefined ? !!item.is_active : true,
        password: '' // empty password on edit
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
      if (formValues[key] !== null && formValues[key] !== undefined && formValues[key] !== '') {
        data[key] = formValues[key];
      }
    });
    
    // Check if id exists to update, else create
    if (data.id) {
        this.dataService.update(data.id, data).subscribe({
          next: () => {
            this.closeModal();
            this.loadData();
          },
          error: (err) => {
            console.error(err);
            alert('Error saving data.');
          }
        });
    } else {
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
