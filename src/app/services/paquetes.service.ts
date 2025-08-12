// src/app/services/paquetes.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Paquete {
  id?: number;
  direccion: string;
  estatus: string | null;
  delivery_id?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PaquetesService {
  private apiUrl = 'http://localhost:3000'; // Cambia por la URL de tu API si es diferente

  constructor(private http: HttpClient) {}

  // Obtener todos los paquetes
  getPaquetes(): Observable<{ mensaje: string; paquetes: Paquete[] }> {
    return this.http.get<{ mensaje: string; paquetes: Paquete[] }>(`${this.apiUrl}/paquetes`);
  }

  // Crear un nuevo paquete
  addPaquete(paquete: Paquete): Observable<{ mensaje: string; paquete: Paquete }> {
    return this.http.post<{ mensaje: string; paquete: Paquete }>(`${this.apiUrl}/addPaquetes`, paquete);
  }

  // Actualizar estatus de un paquete (solo estatus)
  updateEstatus(id: number, estatus: string): Observable<{ mensaje: string; paquete: Paquete }> {
    return this.http.put<{ mensaje: string; paquete: Paquete }>(`${this.apiUrl}/paquetes/${id}`, { estatus });
  }
}
