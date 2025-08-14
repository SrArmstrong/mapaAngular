// location.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private deliveryLocations = new BehaviorSubject<{ [key: number]: { lat: number; lng: number } }>({});
  
  currentLocations = this.deliveryLocations.asObservable();

  // Método para actualizar una sola ubicación (ya existe)
  updateLocation(deliveryId: number, location: { lat: number; lng: number; username?: string; state?: string }) {
    const current = this.deliveryLocations.value;
    this.deliveryLocations.next({ 
      ...current, 
      [deliveryId]: { 
        ...current[deliveryId], 
        ...location 
      } 
    });
  }

  // Método para actualizar múltiples ubicaciones (AÑADIR ESTE)
  updateLocations(newLocations: { [key: number]: { lat: number; lng: number; username?: string; state?: string } }) {
    this.deliveryLocations.next(newLocations);
  }

  // Método para limpiar (ya existe)
  clearLocations() {
    this.deliveryLocations.next({});
  }
}