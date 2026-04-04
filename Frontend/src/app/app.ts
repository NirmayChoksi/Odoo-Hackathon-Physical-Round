import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
<<<<<<< Updated upstream
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
=======
  template: `<router-outlet></router-outlet>`,
  styles: [`
    :host { display: block; }
  `]
})
export class App {
  title = 'SubSync Portal';
>>>>>>> Stashed changes
}
