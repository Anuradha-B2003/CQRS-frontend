import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

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

  getAll(): Observable<ApiResponse<Blog[]>> {
  return this.http.get<ApiResponse<Blog[]>>(`${this.baseUrl}/GetAll`);
}

  create(blog: Blog): Observable<ApiResponse<Blog>> {
  return this.http.post<ApiResponse<Blog>>(`${this.baseUrl}/Create`, blog);
}

  update(id: number, blog: Blog): Observable<ApiResponse<Blog>> {
    return this.http.put<ApiResponse<Blog>>(`${this.baseUrl}/Update/${id}`, blog);
  }

  delete(id: number): Observable<ApiResponse<any>> {
  return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/Delete/${id}`);
  }
  bulkDelete(ids: number[]): Observable<ApiResponse<any>> {
  return this.http.post<ApiResponse<any>>(
    `${this.baseUrl}/BulkDelete`,
    { ids }
  );
}
bulkUpsert(blogs: Blog[]): Observable<ApiResponse<Blog[]>> {
  return this.http.post<ApiResponse<Blog[]>>(
    `${this.baseUrl}/Upsert/Upsert`,
    { blogs } 
  );
}
}
