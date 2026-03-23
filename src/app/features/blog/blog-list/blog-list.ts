import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlogService, Blog } from '../../../services/blog.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialog } from '../confirm-dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatIconModule, 
    MatButtonModule,MatCheckboxModule,MatDialogModule,MatSnackBarModule,
    MatCardModule,MatFormFieldModule,MatInputModule,MatSidenavModule],
  templateUrl: './blog-list.html',
  styleUrls: ['./blog-list.css']
})
export class BlogListComponent implements OnInit {
  blogs=signal<Blog[]>([]);
  loading=signal(false);
  displayedColumns: string[] = ['select', 'id', 'name', 'age', 'content', 'actions'];
  selectedBlogs=signal<number[]>([]);
  pendingChanges = signal<{ type: 'create' | 'update' | 'delete', blog: Blog }[]>([]);

  selectedBlog = signal<Blog | null>(null);
  isFormOpen = signal(false);


  constructor(private blogService: BlogService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar
  ) {}


ngOnInit() {
    this.loadBlogs();
  }

loadBlogs() {
  this.loading.set(true);

  this.blogService.getAll().subscribe(response => {
  console.log("API Response:", response);
    const backendBlogs = response.data;
    const localNewBlogs = this.pendingChanges()
  .filter(x => x.type !== 'delete' && (!x.blog.id || x.blog.id < 0))
  .map(x => x.blog);

const updatedBlogs = backendBlogs.map(b => {
  const local = this.pendingChanges()
    .find(x => x.type !== 'delete' && x.blog.id === b.id);

  return local ? local.blog : b;
});

    this.blogs.set([
      ...localNewBlogs,
      ...updatedBlogs
    ].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));

    this.loading.set(false);
  });
}

createBlog() {
  this.selectedBlog.set({
    id: Date.now() * -1,
    name: '',
    age: 0,
    content: ''
  });

  this.isFormOpen.set(true);
}

editBlog(blog: Blog) {
  this.selectedBlog.set({ ...blog });
  this.isFormOpen.set(true);
}

deleteBlog(id: number) {
  const dialogRef = this.dialog.open(ConfirmDialog,{
    width: '350px',
    data:{
      title: 'Delete Blog',
      message: 'Are you sure you want to delete this blog?',
      confirmText: 'Delete',
      confirmColor:'warn'
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if(result){

      this.blogs.set(this.blogs().filter(b => b.id !== id));

      const blog = { id } as Blog;

      const updatedPending = this.pendingChanges().filter(x => x.blog.id !== id);

      this.pendingChanges.set([
        ...updatedPending,
        { type: 'delete', blog }
      ]);

      this.snackBar.open("Marked for deletion", "Close", {
        duration: 3000
      });
    }
  });
}
toggleSelection(id: number, event: any) {
  const ids=this.selectedBlogs();
  if(event.checked){
    if(!ids.includes(id)){
    this.selectedBlogs.set([...ids,id]);
    }
  } else {
    this.selectedBlogs.set(ids.filter(x => x !== id));
  }

}
deleteSelected(){
  const dialogRef = this.dialog.open(ConfirmDialog,{
    width: '350px',
    data:{
      title: 'Delete Blogs',
      message: 'Are you sure you want to delete selected blogs?',
      confirmText: 'Delete',
      confirmColor:'warn'
    }
  });

  dialogRef.afterClosed().subscribe(result => {

    if(result){

      const ids = this.selectedBlogs();

      this.blogs.set(this.blogs().filter(b => !ids.includes(b.id!)));

      const updatedPending = this.pendingChanges().filter(
        x => !ids.includes(x.blog.id!)
      );

      const deleteOps = ids.map(id => ({
        type: 'delete' as const,
        blog: { id } as Blog
      }));

      this.pendingChanges.set([
        ...updatedPending,
        ...deleteOps
      ]);

      this.snackBar.open("Marked for deletion", "Close", {
        duration: 3000
      });

      this.selectedBlogs.set([]);
    }
  });
}
saveAll() {
  if (this.loading()) return;

  this.loading.set(true);

  const changes = this.pendingChanges();

  if (changes.length === 0) {
    this.snackBar.open("No changes to save", "Close", { duration: 2000 });
    this.loading.set(false);
    return;
  }

  const upserts = changes
    .filter(x => x.type !== 'delete')
    .map(x => ({
      ...x.blog,
      id: x.blog.id! < 0 ? 0 : x.blog.id
    }));

  const deletes = changes
    .filter(x => x.type === 'delete')
    .map(x => x.blog.id)
    .filter((id: number | undefined): id is number => id !== undefined);

  const calls = [];

  if (upserts.length > 0) {
    calls.push(this.blogService.bulkUpsert(upserts));
  }

  if (deletes.length > 0) {
    calls.push(this.blogService.bulkDelete(deletes));
  }

  forkJoin(calls).subscribe(() => {
    this.snackBar.open("All changes saved", "Close", { duration: 3000 });

    this.pendingChanges.set([]);
    this.loadBlogs();
    this.loading.set(false);
  });
}

saveLocal() {
  const blog = this.selectedBlog();
  if (!blog) return;

  const exists = this.blogs().some(b => b.id === blog.id!);

  if (exists) {
    this.blogs.set(
      this.blogs().map(b => b.id === blog.id ? blog : b)
    );
  } else {
    this.blogs.set([blog, ...this.blogs()]);
  }

  const updatedPending = this.pendingChanges().filter(x => x.blog.id !== blog.id);

const type = blog.id! < 0 ? 'create' : 'update';

this.pendingChanges.set([
  ...updatedPending,
  { type, blog }
]);

  this.snackBar.open("Saved locally", "Close", { duration: 2000 });
  this.selectedBlog.set(null);
  this.isFormOpen.set(false);
}
isFieldChanged(field: keyof Blog): boolean {
  const blog = this.selectedBlog();

  if (!blog) return false;

  const original = this.blogs().find(b => b.id === blog.id);

  if (!original) return false;

  return blog[field] !== original[field];
}
hasUnsavedChanges(): boolean {
  const blog = this.selectedBlog();
  if (!blog) return false;

  const original = this.blogs().find(b => b.id === blog.id);

  if (!original) {
    return (
      blog.name.trim() !== '' ||
      blog.age !== 0 ||
      blog.content.trim() !== ''
    );
  }

  return (
    blog.name.trim() !== original.name.trim() ||
    blog.age !== original.age ||
    blog.content.trim() !== original.content.trim()
  );
}
closeForm() {
  this.selectedBlog.set(null);
  this.isFormOpen.set(false);
}
onCancel() {
  if (!this.hasUnsavedChanges()) {
    this.closeForm();
    return;
  }

  const dialogRef = this.dialog.open(ConfirmDialog, {
    width: '350px',
    data: {
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      confirmText: 'Discard',
      confirmColor: 'warn'
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.closeForm();
    }
  });
}

}
