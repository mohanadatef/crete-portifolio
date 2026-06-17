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
    
    // Generate dummy reCAPTCHA token (Replace with real reCAPTCHA v3 implementation)
    const recaptchaToken = 'dummy_frontend_recaptcha_token_123';

    const payload = {
      ...this.formData,
      recaptcha_token: recaptchaToken
    };

    this.leadService.submitLead(payload).subscribe({
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
