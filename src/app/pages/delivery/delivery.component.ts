import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { PanelModule } from 'primeng/panel';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../mapa/mapa.component';
import { io, Socket } from 'socket.io-client';
import { PackagesService } from '../../services/package.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    ToolbarModule,
    DividerModule,
    BadgeModule,
    RippleModule,
    PanelModule,
    MapComponent,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.css']
})
export class DeliveryComponent implements OnInit, OnDestroy{
  paquetes: any[] = [];
  loading = true;
  updatingStatus: { [key: number]: boolean } = {};
  ubicacionActual: { lat: number; lng: number } | null = null;

  private socket!: Socket;
  private geoWatchId?: number;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private packagesService: PackagesService
  ) {}

  ngOnInit(): void {
    this.loadPackages();

    // Conexión con el servidor Socket.IO
    this.socket = io('http://localhost:3000'); // Cambia por tu servidor
    this.socket.on('connect', () => {
      console.log('Conectado a Socket.IO:', this.socket.id);
    });

    // Activar geolocalización en tiempo real
    if (navigator.geolocation) {
      this.geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          this.ubicacionActual = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Nueva ubicación:', this.ubicacionActual);

          // Enviar al servidor por Socket.IO
          this.socket.emit('ubicacion_repartidor', this.ubicacionActual);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      console.warn('Geolocalización no soportada en este navegador.');
    }
  }

  ngOnDestroy(): void {
    // Detener geolocalización y cerrar socket
    if (this.geoWatchId !== undefined) {
      navigator.geolocation.clearWatch(this.geoWatchId);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  loadPackages(): void {
    this.loading = true;
    this.packagesService.getPackages().subscribe({
      next: (response) => {
        this.paquetes = response.paquetes.map((p: any) => ({
          ...p,
          estado: this.mapStatus(p.estatus)
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar paquetes:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los paquetes',
          life: 3000
        });
        this.loading = false;
      }
    });
  }

  private mapStatus(estatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pendiente',
      'in_transit': 'En camino',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statusMap[estatus] || estatus;
  }

  IrInicio() {
    this.router.navigate(['/login']);
  }

  entregarPaquete(paquete: any) {
    this.updatingStatus[paquete.id] = true;
    this.packagesService.updatePackageStatus(paquete.id, 'delivered').subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Paquete marcado como entregado',
          life: 3000
        });
        this.loadPackages();
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado del paquete',
          life: 3000
        });
      },
      complete: () => {
        this.updatingStatus[paquete.id] = false;
      }
    });
  }

  cancelarPaquete(paquete: any) {
    this.updatingStatus[paquete.id] = true;
    this.packagesService.updatePackageStatus(paquete.id, 'cancelled').subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Éxito',
          detail: 'Paquete marcado como cancelado',
          life: 3000
        });
        this.loadPackages();
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado del paquete',
          life: 3000
        });
      },
      complete: () => {
        this.updatingStatus[paquete.id] = false;
      }
    });
  }

  showActions(estado: string): boolean {
    return estado === 'Pendiente' || estado === 'En camino';
  }

  getStatusClass(estado: string): string {
    switch(estado) {
      case 'Entregado': return 'status-delivered';
      case 'Cancelado': return 'status-cancelled';
      default: return '';
    }
  }
}