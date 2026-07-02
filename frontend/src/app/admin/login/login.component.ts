import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  mode: 'login' | 'forgot' | 'reset' = 'login';
  
  loginForm: FormGroup;
  forgotForm: FormGroup;
  resetForm: FormGroup;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['admin@admin.com', [Validators.required, Validators.email]],
      password: ['password', Validators.required]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      token: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('password_confirmation')?.value
      ? null : { mismatch: true };
  }

  setMode(newMode: 'login' | 'forgot' | 'reset') {
    this.mode = newMode;
    this.errorMessage = '';
    this.successMessage = '';
    if (newMode === 'reset') {
      const forgotEmail = this.forgotForm.get('email')?.value;
      if (forgotEmail) {
        this.resetForm.patchValue({ email: forgotEmail });
      }
    }
  }

  onSubmitLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastService.success('Logged in successfully.');
          this.router.navigate(['/admin/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
          this.toastService.error(this.errorMessage);
        }
      });
    }
  }

  onSubmitForgot() {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      const email = this.forgotForm.get('email')?.value;
      
      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastService.success('Reset code has been sent to your email.');
          this.setMode('reset');
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to send reset code.';
          this.toastService.error(this.errorMessage);
        }
      });
    }
  }

  onSubmitReset() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.resetPassword(this.resetForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastService.success('Password reset successfully. You can now login.');
          this.setMode('login');
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to reset password.';
          this.toastService.error(this.errorMessage);
        }
      });
    }
  }
}
