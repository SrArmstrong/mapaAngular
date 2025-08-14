// src/app/services/login.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class LoginService {
  //private apiUrl = 'http://localhost:3000';
  private apiUrl = 'http://http://72.60.31.237/:3000';
  
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    const credentials = { username, password };
    return this.http.post<any>(`${this.apiUrl}/login`, credentials);
  }
}
