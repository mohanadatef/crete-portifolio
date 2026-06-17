import { Component, inject } from '@angular/core';
import { LeadService } from '../../services/lead.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private leadService = inject(LeadService);
  
  formData = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };
  
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';

  onSubmit() {
    this.status = 'loading';
    this.leadService.submitLead(this.formData).subscribe({
      next: () => {
        this.status = 'success';
        this.formData = { name: '', email: '', phone: '', message: '' };
      },
      error: () => {
        this.status = 'error';
      }
    });
  }
}
