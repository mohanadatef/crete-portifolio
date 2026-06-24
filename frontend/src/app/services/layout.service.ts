import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  public showHeaderFooter = signal<boolean>(true);
}
