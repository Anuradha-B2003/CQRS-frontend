import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlogService, Blog } from '../../../services/blog.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialog } from '../confirm-dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import { bindCallback } from 'rxjs';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatIconModule, 
    MatButtonModule,MatCheckboxModule,MatDialogModule,MatSnackBarModule],
  templateUrl: './blog-list.html',
  styleUrls: ['./blog-list.css']
})
export class BlogListComponent implements OnInit {
  blogs=signal<Blog[]>([]);
  loading=signal(false);
  displayedColumns: string[] = ['select','id', 'name', 'age', 'content', 'actions'];
  selectedBlogs=signal<number[]>([]);
  pendingChanges = signal<Blog[]>([]);

  constructor(private blogService: BlogService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar,
      private router: Router
  ) {}
//  ngOnInit(): void {

//   const nav = this.router.getCurrentNavigation();
//   const state = nav?.extras?.state as any;

//   if (state?.blog) {

//     this.loadBlogs(() => {
//       this.applyLocalChange(state.blog, state.isEdit);
//     });

//   } else {
//     this.loadBlogs();
//   }
// }
ngOnInit() {

  this.loadBlogs(); // load backend first

  const stateBlogs:Blog[] = history.state?.blogs || [];

  if (stateBlogs?.length) {

    setTimeout(() => {

      const existing = this.blogs();

      const merged = [...existing];

      stateBlogs.forEach((newBlog) => {
        const index = merged.findIndex(b => b.id === newBlog.id);

        if (index > -1) {
          merged[index] = newBlog;
        } else {
          merged.push(newBlog);
        }
      });

      this.blogs.set(merged);

      this.pendingChanges.set([
        ...this.pendingChanges(),
        ...stateBlogs
      ]);

    });
  }
}
//   loadBlogs(callback?: () => void) {
//     this.loading.set(true);
//   this.blogService.getAll().subscribe(response => {
//   this.blogs.set(response.data); 
//   this.loading.set(false);
//   if(callback) callback();
//   });
// }
loadBlogs() {
  this.loading.set(true);

  this.blogService.getAll().subscribe(response => {

    const backendBlogs = response.data;

    const localNewBlogs = this.pendingChanges().filter(b => !b.id || b.id < 0);

    const updatedBlogs = backendBlogs.map(b => {
      const local = this.pendingChanges().find(x => x.id === b.id);
      return local ? local : b;
    });

    this.blogs.set([
      ...updatedBlogs,
      ...localNewBlogs
    ]);

    this.loading.set(false);
  });
}
editBlog(blog: Blog){
  this.router.navigate(['/blog/edit', blog.id]);
}
createBlog(){
  this.router.navigate(['/blog/create']);
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
      this.blogService.delete(id).subscribe(response => {

        if(response.success){

          this.snackBar.open("Blog Deleted", "Close", {
            duration: 3000
          });

          this.loadBlogs();

        }

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
      title: 'Delete Blog',
      message: 'Are you sure you want to delete this blog?',
      confirmText: 'Delete',
      confirmColor:'warn'
    }
});

  dialogRef.afterClosed().subscribe(result => {

    if(result){

      this.blogService.bulkDelete(this.selectedBlogs()).subscribe(response => {

        if(response.success){

          this.snackBar.open("Selected Blogs Deleted", "Close", {
            duration: 3000
          });

          this.loadBlogs();
          this.selectedBlogs.set([]);

        }

      });

    }else{
      this.snackBar.open("Deletion Cancelled", "Close", {
        duration: 3000
      });
    }
    this.selectedBlogs.set([]);

  });

}
trackChange(blog: Blog) {
  const changes = this.pendingChanges();

  const index = changes.findIndex(x => x.id === blog.id);

  if (index > -1) {
    const updated = [...changes];
    updated[index] = { ...blog };
    this.pendingChanges.set(updated);
  } else {
    this.pendingChanges.set([...changes, { ...blog }]);
  }
}
addNewBlog() {
  const newBlog: Blog = {
    id: 0,
    name: '',
    age: 0,
    content: ''
  };

  this.blogs.set([...this.blogs(), newBlog]);
  this.pendingChanges.set([...this.pendingChanges(), newBlog]);
}
saveAll() {
  const changes = this.pendingChanges();

  if (changes.length === 0) {
    this.snackBar.open("No changes to save", "Close", { duration: 2000 });
    return;
  }
  const payload = changes.map(blog => ({
    id: blog.id && blog.id > 0 ? blog.id : 0, 
    name: blog.name,
    age: blog.age,
    content: blog.content
  }));

  console.log("Sending payload:", payload); // debug

  this.blogService.bulkUpsert(payload).subscribe({
    next: (res) => {
      if (res.success) {
        this.snackBar.open("Saved Successfully", "Close", { duration: 3000 });

        this.pendingChanges.set([]);
        this.loadBlogs();
      } else {
        this.snackBar.open(res.message || "Something went wrong", "Close", {
          duration: 3000
        });
      }
    },
    error: (err) => {
      console.error(err);
      this.snackBar.open("Server error", "Close", { duration: 3000 });
    }
  });
}
applyLocalChange(blog: Blog, isEdit: boolean) {

  const current = this.blogs();

  if (isEdit) {
    const updated = current.map(b => 
      b.id === blog.id ? { ...blog } : b
    );

    this.blogs.set(updated);
  } else {
    this.blogs.set([blog, ...current]);
  }

  const changes = this.pendingChanges();
  const index = changes.findIndex(x => x.id === blog.id);

  if (index > -1) {
    changes[index] = blog;
    this.pendingChanges.set([...changes]);
  } else {
    this.pendingChanges.set([...changes, blog]);
  }
  this.snackBar.open("Change saved locally", "Close", {
    duration: 3000
  });
  console.log("Applying change:", blog, isEdit);
}

}
