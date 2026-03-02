import { Component, OnInit } from '@angular/core';
import { BlogService, Blog } from '../../services/blog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blog.html'
})
export class BlogComponent implements OnInit {

  blogs: Blog[] = [];

  newBlog: Blog = {
    name: '',
    age: 0,
    content: ''
  };

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs() {
    this.blogService.getAll().subscribe(data => {
      this.blogs = data;
    });
  }

  addBlog() {
    this.blogService.create(this.newBlog).subscribe(() => {
      this.loadBlogs();
      this.newBlog = { name: '', age: 0, content: '' };
    });
  }

  deleteBlog(id: number) {
    this.blogService.delete(id).subscribe(() => {
      this.loadBlogs();
    });
  }
}
