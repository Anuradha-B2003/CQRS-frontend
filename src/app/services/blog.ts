import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Blog {
  id?: number;
  name: string;
  age: number;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  private baseUrl = 'https://localhost:7145/Blog'; // your backend URL

  constructor(private http: HttpClient) { }

  getAll(): Observable<Blog[]> {
    return this.http.get<Blog[]>(`${this.baseUrl}/GetAll`);
  }

  create(blog: Blog): Observable<Blog> {
    return this.http.post<Blog>(`${this.baseUrl}/Create`, blog);
  }

  update(id: number, blog: Blog): Observable<Blog> {
    return this.http.put<Blog>(`${this.baseUrl}/Update`, blog);
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/Delete/${id}`);
  }
}
