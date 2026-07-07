import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingService } from '../../core/services/setting.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-blocklist',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './blocklist.component.html',
  styleUrl: './blocklist.component.scss'
})
export class BlocklistComponent implements OnInit {
  private settingService = inject(SettingService);
  private toastService = inject(ToastService);

  blockedContacts: any[] = [];
  loadingBlockedContacts = false;
  blockedPage = 1;
  blockedPerPage = 10;
  blockedLastPage = 1;
  blockedTotal = 0;
  blockedSearch = '';
  blockedType = 'ALL';

  newBlockedValue = '';
  newBlockedType = 'email';
  newBlockedReason = '';
  addingBlocked = false;

  ngOnInit() {
    this.loadBlockedContacts();
  }

  loadBlockedContacts() {
    this.loadingBlockedContacts = true;
    const params = {
      page: this.blockedPage.toString(),
      per_page: this.blockedPerPage.toString(),
      type: this.blockedType,
      search: this.blockedSearch
    };

    this.settingService.getBlockedContacts(params).subscribe({
      next: (res: any) => {
        const paginatedData = res?.data || res;
        this.blockedContacts = paginatedData.data || [];
        this.blockedPage = paginatedData.current_page || 1;
        this.blockedLastPage = paginatedData.last_page || 1;
        this.blockedTotal = paginatedData.total || 0;
        this.loadingBlockedContacts = false;
      },
      error: (err) => {
        console.error('Failed to load blocked contacts', err);
        this.loadingBlockedContacts = false;
        this.toastService.error('Failed to load blocked contacts.');
      }
    });
  }

  onBlockedFilterChange() {
    this.blockedPage = 1;
    this.loadBlockedContacts();
  }

  onBlockedPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.blockedLastPage) {
      this.blockedPage = newPage;
      this.loadBlockedContacts();
    }
  }

  addContactToBlocklist() {
    if (!this.newBlockedValue) {
      this.toastService.warning('Please enter a phone number or email address.');
      return;
    }

    this.addingBlocked = true;
    const data = {
      value: this.newBlockedValue.trim(),
      type: this.newBlockedType,
      reason: this.newBlockedReason
    };

    this.settingService.addBlockedContact(data).subscribe({
      next: () => {
        this.addingBlocked = false;
        this.newBlockedValue = '';
        this.newBlockedReason = '';
        this.toastService.success('Contact added to blocklist successfully.');
        this.loadBlockedContacts();
      },
      error: (err) => {
        this.addingBlocked = false;
        console.error(err);
        const errorMsg = err?.error?.message || 'Failed to add contact to blocklist.';
        this.toastService.error(errorMsg);
      }
    });
  }

  removeContactFromBlocklist(id: number) {
    if (confirm('Are you sure you want to remove this contact from blocklist?')) {
      this.settingService.deleteBlockedContact(id).subscribe({
        next: () => {
          this.toastService.success('Contact removed from blocklist.');
          this.loadBlockedContacts();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to remove contact from blocklist.');
        }
      });
    }
  }
}
