// import { Component, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   imports: [RouterOutlet],
//   templateUrl: './app.html',
//   styleUrl: './app.css'
// })
// export class App {
//   protected readonly title = signal('blog-ui');
// }

// import { Component } from '@angular/core';
// import { BlogComponent } from './features/blog/blog';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [BlogComponent],
//   template: '<app-blog></app-blog>'
// })
// export class App {}
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class App {}


