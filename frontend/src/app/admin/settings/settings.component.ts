import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingService } from '../../core/services/setting.service';
import { MediaService } from '../../core/services/media.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AuthService } from '../../services/auth.service';
import { QuillModule } from 'ngx-quill';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, QuillModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private settingService = inject(SettingService);
  private mediaService = inject(MediaService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  activeTab: any = 'general';
  
  socialLinks: Array<{ 
    icon: string; 
    url: string; 
    show_in_footer: boolean; 
    show_in_chat: boolean;
    custom_icon_svg?: string;
    custom_color?: string;
    icon_style?: string;
  }> = [];

  settings: { [key: string]: string } = {
    site_name: 'CRETE Developments',
    site_logo: '',
    seo_title: '',
    google_tag: '',
    web_primary_color: '#c89f45',
    web_secondary_color: '#1e3678',
    admin_primary_color: '#1e3678',
    available_languages: 'en,ar',
    recaptcha_site_key: '',
    recaptcha_secret_key: '',
    mail_host: '',
    mail_port: '',
    mail_username: '',
    mail_password: '',
    mail_encryption: '',
    mail_from_address: '',
    mail_from_name: '',
    mail_to_address: '',
    client_thank_you_subject: '',
    client_thank_you_body: '',
    mail_client_enabled: '1',
    mail_agent_enabled: '1',
    social_links: '[]',
    company_branches: '[]',
    company_stats: '[]',
    home_hero_title_en: 'Crete Developments',
    home_hero_title_ar: 'كريت للتطوير العقاري',
    home_hero_subtitle_en: 'Premium Real Estate Developments.',
    home_hero_subtitle_ar: 'تطوير عقاري فاخر.',
    home_legacy_title_en: 'Decades of Excellence & Real Estate Leadership',
    home_legacy_title_ar: 'عقود من التميز والريادة العقارية',
    home_legacy_desc_en: '',
    home_legacy_desc_ar: '',
    home_partners: '[]',
    home_construction_updates: '[]',
    home_hero_bg: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=90',
    recaptcha_enabled: '0'
  };

  branchesList: Array<{
    name_en: string;
    name_ar: string;
    phones: string[];
    emails: string[];
    address_en: string;
    address_ar: string;
  }> = [];

  statsList: Array<{
    number: string;
    suffix: string;
    label_en: string;
    label_ar: string;
  }> = [];

  partnersList: Array<{
    name: string;
    logoText: string;
    desc: string;
  }> = [];

  constructionUpdatesList: Array<{
    title_en: string;
    title_ar: string;
    location_en: string;
    location_ar: string;
    progress: number;
    phase_en: string;
    phase_ar: string;
    image: string;
  }> = [];

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  logoUploading = false;
  logoPreview: string | null = null;
  heroBgUploading = false;

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.status = 'loading';
    this.settingService.getAll().subscribe({
      next: (res: any) => {
        // Handle both wrapped and unwrapped array
        const settingsArray = res?.data || res;
        if (Array.isArray(settingsArray)) {
          settingsArray.forEach(item => {
            if (item.key && item.value !== null && item.value !== undefined) {
              this.settings[item.key] = item.value;
            }
          });
        }
        
        if (this.settings['social_links']) {
          try {
            this.socialLinks = Array.isArray(this.settings['social_links']) ? (this.settings['social_links'] as any) : JSON.parse(this.settings['social_links']);
          } catch (e) {
            this.socialLinks = [];
          }
        } else {
          this.socialLinks = [];
        }

        if (this.settings['company_branches']) {
          try {
            this.branchesList = Array.isArray(this.settings['company_branches']) ? (this.settings['company_branches'] as any) : JSON.parse(this.settings['company_branches']);
          } catch (e) {
            this.branchesList = [];
          }
        } else {
          this.branchesList = [];
        }

        if (this.settings['company_stats']) {
          try {
            this.statsList = Array.isArray(this.settings['company_stats']) ? (this.settings['company_stats'] as any) : JSON.parse(this.settings['company_stats']);
          } catch (e) {
            this.statsList = [];
          }
        } else {
          this.statsList = [];
        }

        if (this.settings['home_partners']) {
          try {
            this.partnersList = Array.isArray(this.settings['home_partners']) ? (this.settings['home_partners'] as any) : JSON.parse(this.settings['home_partners']);
          } catch (e) {
            this.partnersList = [];
          }
        } else {
          this.partnersList = [];
        }

        if (this.settings['home_construction_updates']) {
          try {
            this.constructionUpdatesList = Array.isArray(this.settings['home_construction_updates']) ? (this.settings['home_construction_updates'] as any) : JSON.parse(this.settings['home_construction_updates']);
          } catch (e) {
            this.constructionUpdatesList = [];
          }
        } else {
          this.constructionUpdatesList = [];
        }
        
        this.status = 'idle';
      },
      error: () => {
        this.status = 'error';
      }
    });
  }

  onLogoSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.logoUploading = true;
      
      // Local preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreview = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload to server
      this.mediaService.upload(file).subscribe({
        next: (res) => {
          this.settings['site_logo'] = res.data.url;
          this.logoUploading = false;
        },
        error: (err) => {
          this.logoUploading = false;
          console.error(err);
          this.toastService.error('Failed to upload logo.');
          this.logoPreview = null;
        }
      });
    }
  }

  onHeroBgSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.heroBgUploading = true;
      this.mediaService.upload(file).subscribe({
        next: (res) => {
          this.settings['home_hero_bg'] = res.data.url;
          this.heroBgUploading = false;
        },
        error: (err) => {
          this.heroBgUploading = false;
          console.error(err);
          this.toastService.error('Failed to upload hero background.');
        }
      });
    }
  }

  onConstructionImageSelect(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.mediaService.upload(file).subscribe({
        next: (res) => {
          this.constructionUpdatesList[index].image = res.data.url;
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to upload construction image.');
        }
      });
    }
  }

  removeLogo() {
    this.settings['site_logo'] = '';
    this.logoPreview = null;
  }

  saveSettings() {
    this.settings['social_links'] = JSON.stringify(this.socialLinks);
    this.settings['company_branches'] = JSON.stringify(this.branchesList);
    this.settings['company_stats'] = JSON.stringify(this.statsList);
    this.settings['home_partners'] = JSON.stringify(this.partnersList);
    this.settings['home_construction_updates'] = JSON.stringify(this.constructionUpdatesList);
    this.status = 'loading';
    
    // Call bulk update setting endpoint
    this.settingService.updateBulk(this.settings).subscribe({
      next: () => {
        this.status = 'success';
        this.toastService.success('Settings saved successfully.');
        
        // Dynamically apply site color changes if in preview
        if (isPlatformBrowser(this.platformId)) {
          document.documentElement.style.setProperty('--crete-gold', this.settings['web_primary_color']);
          document.documentElement.style.setProperty('--crete-blue', this.settings['web_secondary_color']);
        }
        
        setTimeout(() => this.status = 'idle', 3000);
      },
      error: () => {
        this.status = 'error';
        this.toastService.error('Failed to save settings.');
      }
    });
  }

  addPartner() {
    this.partnersList.push({ name: '', logoText: '', desc: '' });
  }

  removePartner(index: number) {
    this.partnersList.splice(index, 1);
  }

  addConstructionUpdate() {
    this.constructionUpdatesList.push({
      title_en: '',
      title_ar: '',
      location_en: '',
      location_ar: '',
      progress: 50,
      phase_en: '',
      phase_ar: '',
      image: ''
    });
  }

  removeConstructionUpdate(index: number) {
    this.constructionUpdatesList.splice(index, 1);
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  addSocialLink() {
    this.socialLinks.push({
      icon: 'whatsapp',
      url: '',
      show_in_footer: true,
      show_in_chat: true,
      custom_icon_svg: '',
      custom_color: '#c89f45',
      icon_style: 'stroke'
    });
  }

  removeSocialLink(index: number) {
    this.socialLinks.splice(index, 1);
  }

  isLangSelected(lang: string): boolean {
    const langs = this.settings['available_languages'] || 'en,ar';
    return langs.split(',').includes(lang);
  }

  toggleLang(lang: string) {
    const currentLangs = (this.settings['available_languages'] || '').split(',').filter(l => l);
    const index = currentLangs.indexOf(lang);
    
    if (index > -1) {
      // Don't allow deselecting all languages
      if (currentLangs.length === 1) {
        this.toastService.warning('You must keep at least one active language.');
        return;
      }
      currentLangs.splice(index, 1);
    } else {
      currentLangs.push(lang);
    }
    
    this.settings['available_languages'] = currentLangs.join(',');
  }

  addBranch() {
    this.branchesList.push({
      name_en: 'New Branch',
      name_ar: 'فرع جديد',
      phones: [''],
      emails: [''],
      address_en: '',
      address_ar: ''
    });
  }

  removeBranch(index: number) {
    this.branchesList.splice(index, 1);
  }

  addBranchPhone(bIdx: number) {
    this.branchesList[bIdx].phones.push('');
  }

  removeBranchPhone(bIdx: number, pIdx: number) {
    this.branchesList[bIdx].phones.splice(pIdx, 1);
  }

  addBranchEmail(bIdx: number) {
    this.branchesList[bIdx].emails.push('');
  }

  removeBranchEmail(bIdx: number, eIdx: number) {
    this.branchesList[bIdx].emails.splice(eIdx, 1);
  }

  addStat() {
    this.statsList.push({
      number: '100',
      suffix: '+',
      label_en: 'New Stat',
      label_ar: 'إحصائية جديدة'
    });
  }

  removeStat(index: number) {
    this.statsList.splice(index, 1);
  }

  backupLoading = false;

  downloadDatabaseBackup() {
    this.backupLoading = true;
    this.settingService.downloadBackup().subscribe({
      next: (blob: Blob) => {
        this.backupLoading = false;
        
        // Trigger file download in browser
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-backup-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.toastService.success('Database backup downloaded successfully.');
      },
      error: (err) => {
        this.backupLoading = false;
        console.error(err);
        this.toastService.error('Failed to generate or download database backup.');
      }
    });
  }

  trackByFn(index: any, item: any) {
    return index;
  }
}
