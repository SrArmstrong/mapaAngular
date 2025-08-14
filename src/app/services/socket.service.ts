import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  /*
  constructor() {
    this.socket = io('http://localhost:3000', {
      withCredentials: true
    });
  }
  */

  constructor() {
    this.socket = io('https://72.60.31.237', {
      withCredentials: true,
      path: '/proyecto1/api/socket.io'
    });
  }

  // Unirse como administrador
  joinAsAdmin(): void {
    this.socket.emit('join-admin');
  }

  // Escuchar actualizaciones de ubicación
  onLocationUpdate(callback: (data: {
    deliveryId: number;
    ubicacion: { latitud: number; longitud: number };
    timestamp: string;
  }) => void): void {
    this.socket.on('ubicacion_repartidor', callback);
  }

  // Obtener ubicaciones iniciales
  getCurrentLocations(callback: (locations: {
    [key: number]: {
      latitud: number;
      longitud: number;
      estado: string;
    };
  }) => void): void {
    this.socket.emit('obtener_ubicaciones');
    this.socket.on('ubicaciones_actuales', callback);
  }

  // Desconectar
  disconnect(): void {
    if (this.socket) this.socket.disconnect();
  }
}