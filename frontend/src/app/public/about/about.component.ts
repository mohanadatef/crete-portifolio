import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/models';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html'
})
export class AboutComponent implements OnInit {
  private pageService = inject(PageService);
  translate = inject(TranslateService);

  page = signal<Page | null>(null);
  isLoading = true;

  ngOnInit() {
    this.loadPageContent();
  }

  loadPageContent() {
    this.pageService.getPublicBySlug('about-us').subscribe({
      next: (res) => {
        this.page.set(res.data);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
