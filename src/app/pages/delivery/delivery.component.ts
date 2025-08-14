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
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../services/delivery.service';
import { LocationService } from '../../services/location.service';
import { PackagesService } from '../../services/package.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface Package {
  id: number;
  direccion: string;
  estatus: string;
  deliveryid: number | null;
}

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
    FormsModule,
    ProgressSpinnerModule,
    ToggleButtonModule
  ],
  providers: [MessageService],
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.css']
})
export class DeliveryComponent implements OnInit, OnDestroy {
  paquetes: Package[] = [];
  loading = true;
  deliveryState: boolean = false;
  updatingStatus: { [key: number]: boolean } = {};
  ubicacionActual: { lat: number; lng: number } | null = null;
  deliveryId: number | null = null;

  private socket!: Socket;
  private geoWatchId?: number;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private packagesService: PackagesService,
    private locationService: LocationService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {

    this.checkInitialState();

    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      this.deliveryId = Number(storedUserId);
    } else {
      console.warn('No se encontró userId en localStorage');
    }

    
    this.loadPackages();

    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Conectado a Socket.IO:', this.socket.id);
      this.startGeolocationTracking(); 
    });

    this.startGeolocationTracking();
  }

  private checkInitialState(): void {
      if (!this.deliveryId) return;

      // Primero verifica si hay estado guardado en localStorage
      const savedState = localStorage.getItem('deliveryState');
      if (savedState) {
          this.deliveryState = savedState === 'Activo';
      }

      // Luego actualiza con el estado del servidor
      this.deliveryService.getDeliveryById(this.deliveryId).subscribe({
          next: (response) => {
              this.deliveryState = response.state === 'Activo';
              localStorage.setItem('deliveryState', response.state);
          },
          error: (err) => {
              console.error('Error al obtener estado:', err);
              if (!savedState) {
                  this.deliveryState = false;
              }
          }
      });
  }

  onStateChange(event: any): void {
      if (this.deliveryId === null) return;
      
      const newState = event.checked ? 'Activo' : 'Inactivo'; // Ajusta estos estados según tu backend
      
      this.deliveryService.updateDeliveryState(this.deliveryId, newState).subscribe({
          next: () => {
              localStorage.setItem('deliveryState', newState);
              this.messageService.add({
                  severity: 'success',
                  summary: 'Éxito',
                  detail: `Estado actualizado a ${newState === 'Activo' ? 'Disponible' : 'No disponible'}`,
                  life: 3000
              });
          },
          error: (err) => {
              console.error('Error al actualizar estado:', err);
              this.deliveryState = !event.checked; // Revertir el cambio si hay error
              this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudo actualizar el estado',
                  life: 3000
              });
          }
      });
  }

  private startGeolocationTracking(): void {
    if (navigator.geolocation) {
      this.geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          this.ubicacionActual = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          console.log('Nueva ubicación capturada:', this.ubicacionActual);

          if (this.deliveryId) {
            this.locationService.updateLocation(
              this.deliveryId, 
              this.ubicacionActual
            );
            const payload = { deliveryId: this.deliveryId, ubicacion: this.ubicacionActual };
            console.log('Emitir ubicación:', payload);
            this.socket.emit('ubicacion_repartidor', payload);
          }
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo obtener la ubicación',
            life: 3000
          });
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      console.warn('Geolocalización no soportada en este navegador.');
    }
  }

  ngOnDestroy(): void {
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
      next: (response: any) => {
        this.paquetes = (response.paquetes || []).map((p: any) => ({
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

  entregarPaquete(paquete: Package) {
    if (!paquete.id) return;
    
    this.updatingStatus[paquete.id] = true;
    this.packagesService.updatePackageStatus(paquete.id, 'delivered').subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Paquete marcado como entregado',
          life: 3000
        });
        this.updateLocalPackageStatus(paquete.id, 'delivered');
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

  cancelarPaquete(paquete: Package) {
    if (!paquete.id) return;
    
    this.updatingStatus[paquete.id] = true;
    this.packagesService.updatePackageStatus(paquete.id, 'cancelled').subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Éxito',
          detail: 'Paquete marcado como cancelado',
          life: 3000
        });
        this.updateLocalPackageStatus(paquete.id, 'cancelled');
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

  private updateLocalPackageStatus(packageId: number, status: string): void {
    const index = this.paquetes.findIndex(p => p.id === packageId);
    if (index !== -1) {
      this.paquetes[index].estatus = status;
      //this.paquetes[index].estado = this.mapStatus(status);
    }
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