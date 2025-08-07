import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class DeliveryService {

    private apiUrl = 'http://localhost:3001';

    constructor(private http: HttpClient) {}

    getDeliveries(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/delivery`);
    }

}
