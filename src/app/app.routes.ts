import { Routes } from '@angular/router';
import { BlogListComponent } from './features/blog/blog-list/blog-list';
import { BlogFormComponent } from './features/blog/blog-form/blog-form';
import { unsavedChangesGuard } from './guards/unsaved-changes-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'blog', pathMatch: 'full' },
  { path: 'blog', component: BlogListComponent },
  { path: 'blog/create', component: BlogFormComponent, canDeactivate: [unsavedChangesGuard] },
  { path: 'blog/edit/:id', component: BlogFormComponent,canDeactivate: [unsavedChangesGuard] }
];
