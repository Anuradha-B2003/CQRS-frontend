import { Component, OnInit } from '@angular/core';
import { BlogService, Blog } from '../../services/blog.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { NgForm } from '@angular/forms';
//import { ChangeDetectorRef } from '@angular/core';
import {signal} from '@angular/core';
import { ConfirmDialog } from './confirm-dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule,MatInputModule,MatButtonModule,
    MatFormFieldModule,MatCardModule,MatTableModule,MatIconModule,
    MatSnackBarModule,MatDialogModule,MatCheckboxModule],
  templateUrl: './blog.html'
})
export class BlogComponent implements OnInit {
  
  blogs=signal<Blog[]>([]);
  loading=signal(false);
  isEditMode = signal(false);
  displayedColumns: string[] = ['select','id', 'name', 'age', 'content', 'actions'];
  selectedBlogs=signal<number[]>([]);
  originalBlog: Blog | null = null;
  editingBlogId=signal<number | null>(null);

  newBlog: Blog = {
    name: '',
    age: 0,
    content: ''
  };

  constructor(private blogService: BlogService,
     private snackBar: MatSnackBar,
     private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs() {
    this.loading.set(true);
  this.blogService.getAll().subscribe(response => {
    //this.cd.markForCheck();
  this.blogs.set(response.data); 
  this.loading.set(false);
});
  }


saveBlog(form: any){

  const request: any = this.isEditMode()
    ? this.blogService.update(this.newBlog.id!, this.newBlog)
    : this.blogService.create(this.newBlog);

  request.subscribe((response: any) => {
    if(response.success){

    const message = this.isEditMode()
      ? "Blog Updated Successfully"
      : "Blog Added Successfully";

    this.snackBar.open(message, "Close", { duration: 3000 });

    this.loadBlogs();
    this.resetForm();
    form.resetForm();
    }else {
      this.snackBar.open(response.message || "Something went wrong", "Close", {
        duration: 3000
      });
    }
  });

}
resetForm(){
  this.newBlog = { name:'', age:0, content:'' };
  this.isEditMode.set(false);
  this.originalBlog = null;
  this.editingBlogId.set(null);
}
// editBlog(blog: Blog){
//   this.newBlog = {...blog};
//   this.isEditMode=true;
// }
editBlog(blog: Blog){

  if(this.originalBlog && this.hasUnsavedChanges()){

    const dialogRef = this.dialog.open(ConfirmDialog,{
      width:'350px',
      data:{
        title:'Unsaved Changes',
        message:'You have unsaved changes. If you continue, your changes will be lost.',
        confirmText:'Continue',
        confirmColor:'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {

      if(result){
        this.loadBlog(blog);
      }

    });

  }
  else{

    this.loadBlog(blog);

  }

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
hasUnsavedChanges(): boolean {

  if(!this.originalBlog) return false;

  return (
    this.newBlog.name.trim() !== this.originalBlog.name.trim() ||
    this.newBlog.age !== this.originalBlog.age ||
    this.newBlog.content.trim() !== this.originalBlog.content.trim()
  );

}
loadBlog(blog: Blog){

  this.newBlog = {...blog};

  this.originalBlog = {...blog};

  this.isEditMode.set(true);
  this.editingBlogId.set(blog.id!);
  console.log("editing row id: ", this.editingBlogId());

}
isFieldChanged(field: keyof Blog): boolean {

  if (!this.originalBlog) return false;

  const newValue = (this.newBlog[field] ?? '').toString().trim();
  const originalValue = (this.originalBlog[field] ?? '').toString().trim();

  return newValue !== originalValue;

}
}
