import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['admin@example.com', [Validators.required, Validators.email]],
      password: ['password123', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      // Temporary logic: just redirect to dashboard
      // TODO: Connect to Laravel API later
      this.router.navigate(['/admin/dashboard']);
    }
  }
}
