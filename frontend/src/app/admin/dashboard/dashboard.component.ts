import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ProjectService } from '../../core/services/project.service';
import { LandingPageService } from '../../core/services/landing-page.service';
import { TranslateService } from '@ngx-translate/core';
import { Project, LandingPage } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private projectService = inject(ProjectService);
  private landingPageService = inject(LandingPageService);
  translate = inject(TranslateService);

  stats: any = null;
  projects = signal<Project[]>([]);
  landingPages = signal<LandingPage[]>([]);
  
  // Filter variables
  selectedProjectId: string = '';
  selectedLandingPageId: string = '';
  selectedRange: 'today' | 'yesterday' | 'week' | 'month' | 'custom' = 'week';
  startDate: string = '';
  endDate: string = '';

  // Chart coordinates
  chartBars: any[] = [];
  chartGridLines: any[] = [];
  chartMaxCount: number = 5;
  chartRotateLabels: boolean = false;
  isLoading = false;

  ngOnInit() {
    this.loadFiltersData();
    this.fetchStats();
  }

  loadFiltersData() {
    // Load projects list
    this.projectService.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        const data = res?.data?.data || res?.data || res;
        if (Array.isArray(data)) {
          this.projects.set(data);
        }
      }
    });

    // Load landing pages list
    this.landingPageService.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        const data = res?.data?.data || res?.data || res;
        if (Array.isArray(data)) {
          this.landingPages.set(data);
        }
      }
    });
  }

  fetchStats() {
    this.isLoading = true;
    
    // Construct query parameters
    const params: any = {
      range: this.selectedRange
    };

    if (this.selectedProjectId) {
      params.project_id = this.selectedProjectId;
    }
    if (this.selectedLandingPageId) {
      params.landing_page_id = this.selectedLandingPageId;
    }
    if (this.selectedRange === 'custom') {
      if (this.startDate) params.start_date = this.startDate;
      if (this.endDate) params.end_date = this.endDate;
    }

    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`, { params }).subscribe({
      next: (res) => {
        this.stats = res.data || res;
        this.calculateChart();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load stats', err);
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    this.fetchStats();
  }

  /** Build query params to pass to leads page from the current dashboard filters */
  get leadsQueryParams(): any {
    const p: any = { range: this.selectedRange };
    if (this.selectedProjectId)    p['project_id']     = this.selectedProjectId;
    if (this.selectedLandingPageId) p['landing_page_id'] = this.selectedLandingPageId;
    if (this.selectedRange === 'custom') {
      if (this.startDate) p['start_date'] = this.startDate;
      if (this.endDate)   p['end_date']   = this.endDate;
    }
    return p;
  }

  calculateChart() {
    if (!this.stats || !this.stats.chart_data || this.stats.chart_data.length === 0) {
      this.chartBars = [];
      this.chartGridLines = [];
      return;
    }

    const data = this.stats.chart_data;
    const counts = data.map((d: any) => d.count);
    const maxVal = Math.max(...counts, 0);
    this.chartMaxCount = maxVal > 0 ? maxVal : 5;

    const svgWidth = 800;
    const svgHeight = 260;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 50;
    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop;

    const numItems = data.length;
    const slotWidth = chartWidth / (numItems || 1);
    const barWidthPercent = 0.55; // width ratio of bars in each slot

    // Rotate labels when bars are dense to prevent text overlap
    // Labels are ~30px wide; slot needs to be >= 32px for horizontal text
    this.chartRotateLabels = slotWidth < 32;

    this.chartBars = data.map((item: any, i: number) => {
      const height = (item.count / this.chartMaxCount) * (chartHeight - 20);
      const x = paddingLeft + (i * slotWidth) + (slotWidth * (1 - barWidthPercent) / 2);
      const y = svgHeight - height;
      const cx = x + (slotWidth * barWidthPercent) / 2; // center X of bar

      const dateObj = new Date(item.date);
      const formattedDate = dateObj.toLocaleDateString(this.translate.currentLang() === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });

      // Transform string for rotated labels — rotate around the label center point
      const labelTransform = this.chartRotateLabels
        ? `rotate(-45 ${cx} 278)`
        : '';

      return {
        x,
        y,
        cx,
        width: slotWidth * barWidthPercent,
        height,
        date: item.date,
        count: item.count,
        formattedDate,
        labelTransform
      };
    });

    // Generate grid lines
    this.chartGridLines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const value = Math.round(this.chartMaxCount * ratio);
      const y = svgHeight - (ratio * (chartHeight - 20));
      this.chartGridLines.push({ y, value });
    }
  }
}
