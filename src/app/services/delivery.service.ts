import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class DeliveryService {

    //private apiUrl = 'http://localhost:3000';
    private apiUrl = 'https://72.60.31.237/proyecto1/api';

    constructor(private http: HttpClient) {}

    getDeliveryById(deliveryId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/delivery/${deliveryId}`);
    }

    getDeliveries(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/delivery`);
    }

    updateDeliveryState(deliveryId: number, state: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/updateDeliveryState/${deliveryId}`, { state });
    }
}
