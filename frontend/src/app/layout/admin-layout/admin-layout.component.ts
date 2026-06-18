import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, HasPermissionDirective],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {

}
