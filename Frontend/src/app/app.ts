import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  ButtonComponent,
  InputComponent,
  CheckboxComponent,
  BadgeComponent,
  AvatarComponent,
  CardComponent,
  SelectComponent,
  TextareaComponent,
  ToggleComponent,
  NavbarComponent,
  ModalComponent
} from './components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonComponent,
    InputComponent,
    CheckboxComponent,
    BadgeComponent,
    AvatarComponent,
    CardComponent,
    SelectComponent,
    TextareaComponent,
    ToggleComponent,
    NavbarComponent,
    ModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = signal('SubSync UI Demo');
  navItems = signal([
    { label: 'Projects', active: true },
    { label: 'Blueprints' },
    { label: 'Compliance' }
  ]);
  
  // demo state
  demoCheckbox = signal(false);
  demoSelect = signal('');
  demoTextarea = signal('');
  demoToggle = signal(true);
}
