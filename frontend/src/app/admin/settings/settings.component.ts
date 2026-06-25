import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingService } from '../../core/services/setting.service';
import { MediaService } from '../../core/services/media.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AuthService } from '../../services/auth.service';
import { QuillModule } from 'ngx-quill';

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

  activeTab: 'general' | 'appearance' | 'languages' | 'navigation' | 'security' | 'email' = 'general';
  
  settings: { [key: string]: string } = {
    site_name: 'CRETE Developments',
    site_logo: '',
    seo_title: '',
    google_tag: '',
    web_primary_color: '#c89f45',
    web_secondary_color: '#1e3678',
    admin_primary_color: '#1e3678',
    available_languages: 'en,ar',
    show_projects: '1',
    show_blog: '1',
    show_contact: '1',
    show_about: '1',
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
    mail_agent_enabled: '1'
  };

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  logoUploading = false;
  logoPreview: string | null = null;

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
          alert('Failed to upload logo.');
          this.logoPreview = null;
        }
      });
    }
  }

  removeLogo() {
    this.settings['site_logo'] = '';
    this.logoPreview = null;
  }

  saveSettings() {
    this.status = 'loading';
    
    // Call bulk update setting endpoint
    this.settingService.updateBulk(this.settings).subscribe({
      next: () => {
        this.status = 'success';
        
        // Dynamically apply site color changes if in preview
        document.documentElement.style.setProperty('--crete-gold', this.settings['web_primary_color']);
        document.documentElement.style.setProperty('--crete-blue', this.settings['web_secondary_color']);
        
        setTimeout(() => this.status = 'idle', 3000);
      },
      error: () => {
        this.status = 'error';
        alert('Failed to save settings.');
      }
    });
  }

  setTab(tab: 'general' | 'appearance' | 'languages' | 'navigation' | 'security' | 'email') {
    this.activeTab = tab;
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
        alert('You must keep at least one active language.');
        return;
      }
      currentLangs.splice(index, 1);
    } else {
      currentLangs.push(lang);
    }
    
    this.settings['available_languages'] = currentLangs.join(',');
  }
}
