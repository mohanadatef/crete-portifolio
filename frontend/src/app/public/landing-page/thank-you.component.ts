import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-thank-you',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="py-24 bg-gray-50 flex flex-col items-center justify-center font-sans p-6">
      <div class="bg-white p-10 rounded-3xl shadow-xl text-center max-w-lg w-full border border-gray-100 relative overflow-hidden">
        <!-- Decorative Background -->
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>

        <div class="relative z-10">
          <div class="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl shadow-sm border border-green-100">
            <i class="fi fi-rr-check-circle"></i>
          </div>
          
          <h1 class="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {{ 'THANK_YOU.TITLE' | translate }}
          </h1>
          
          <p class="text-gray-500 text-lg mb-10 leading-relaxed">
            {{ 'THANK_YOU.SUBTITLE' | translate }}
          </p>
          
          <div class="space-y-4">
            <a routerLink="/" class="block w-full bg-slate-900 text-white font-medium py-3.5 px-6 rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20">
              {{ 'THANK_YOU.RETURN_HOME' | translate }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ThankYouComponent {}
