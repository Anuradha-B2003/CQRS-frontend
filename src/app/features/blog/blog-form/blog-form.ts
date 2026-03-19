import { Component,OnInit,signal } from '@angular/core';
import { BlogService, Blog } from '../../../services/blog.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../confirm-dialog';
import { CanComponentDeactivate } from '../../../guards/unsaved-changes-guard';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-blog-form',
  standalone: true,
  imports: [CommonModule, FormsModule,MatCardModule, MatInputModule, 
    MatButtonModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './blog-form.html',
})
export class BlogFormComponent implements OnInit,CanComponentDeactivate {
    newBlog: Blog = {
      name: '',
      age: 0,
      content: ''
    };
    originalBlog: Blog | null = null;
    isEditMode = signal(false);
     constructor(
    private blogService: BlogService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}
   ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if(id){
      this.isEditMode.set(true);

      this.blogService.getAll().subscribe(res => {
        const blog = res.data.find(x => x.id === +id);
        if(blog){
          setTimeout(()=>{
          this.newBlog = {...blog};
          this.originalBlog = {...blog}; 
        });
        }
      });
    }
  }
//   saveBlog(form: any) {

//   const isEdit = this.isEditMode();

//   const request = isEdit
//     ? this.blogService.update(this.newBlog.id!, this.newBlog)
//     : this.blogService.create(this.newBlog);

//   request.subscribe({
//     next: (response) => {
//       if (response.success) {
//         this.originalBlog={...this.newBlog};

//         const message = isEdit
//           ? "Blog Updated Successfully"
//           : "Blog Created Successfully";

//         this.snackBar.open(message, "Close", { duration: 3000 });

//         this.router.navigate(['/blog']); // go back to list

//       } else {
//         this.snackBar.open(response.message || "Something went wrong", "Close", {
//           duration: 3000
//         });
//       }
//     },

//     error: (err) => {
//       console.error(err);
//       this.snackBar.open("Server error occurred", "Close", {
//         duration: 3000
//       });
//     }
//   });
// }
// saveBlog() {
//   this.originalBlog = { ...this.newBlog };
//   if (!this.newBlog.id) {
//     this.newBlog.id = -Date.now();
//   }

//   const message = this.isEditMode()
//     ? "Blog Updated Locally"
//     : "Blog Created Locally";

//   this.snackBar.open(message, "Close", { duration: 3000 });

//   this.router.navigate(['/blog'], {
//     state: {
//       blog: this.newBlog,
//       isEdit: this.isEditMode() 
//     }
//   });
// }
saveBlog() {

  const blogToSend = {
    ...this.newBlog,
    id: this.isEditMode()
      ? this.newBlog.id
      : -Date.now()
  };

  const existing = history.state?.blogs || [];
  this.router.navigate(['/blog'], {
  state: {
    blogs: [...existing, blogToSend]
  }
});

  this.snackBar.open(
    this.isEditMode() ? "Updated" : "Created",
    "Close",
    { duration: 3000 }
  );

  this.router.navigate(['/blog'], {
    state: {
      blogs: [...existing, blogToSend] // ✅ accumulate
    }
  });
}
goBack() {
  //this.originalBlog={...this.newBlog};
  this.router.navigate(['/blog']);
}
isFieldChanged(field: keyof Blog): boolean {

  if (!this.originalBlog) return false;

  const newValue = (this.newBlog[field] ?? '').toString().trim();
  const originalValue = (this.originalBlog[field] ?? '').toString().trim();

  return newValue !== originalValue;

}
hasUnsavedChanges(): boolean {

  if(!this.originalBlog) return false;

  return (
    this.newBlog.name.trim() !== this.originalBlog.name.trim() ||
    this.newBlog.age !== this.originalBlog.age ||
    this.newBlog.content.trim() !== this.originalBlog.content.trim()
  );

}
canDeactivate() {

  if (!this.isEditMode()) return true; 
  if (!this.hasUnsavedChanges()) return true;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '350px',
      data: {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Do you really want to leave?',
        confirmText: 'Leave',
        confirmColor: 'warn'
      }
    });

    return dialogRef.afterClosed();
}


@HostListener('window:beforeunload', ['$event'])
handleBeforeUnload(event: BeforeUnloadEvent) {

  if (this.isEditMode() && this.hasUnsavedChanges()) {

    event.preventDefault();
    event.returnValue = ''; // required for browser popup

  }

}

}
