import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';
import { LocationService } from '../../services/location.service';
import { DeliveryService } from '../../services/delivery.service';
import { PackagesService } from '../../services/package.service';
import { MapComponent } from '../mapa/mapa.component';

interface Package {
  id: number;
  direccion: string;
  estatus: string;
  deliveryid: number | null;
}

interface Delivery {
  id: number;
  username: string;
  state: string;
  lat: number | null;
  lng: number | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    ToolbarModule,
    DividerModule,
    BadgeModule,
    RippleModule,
    PanelModule,
    DialogModule,
    InputTextModule,
    MapComponent,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  deliverys: Delivery[] = [];
  unassignedPackages: Package[] = [];
  selectedDelivery: Delivery | null = null;
  displayAddPackageDialog = false;
  displayAssignDialog = false;
  repartidoresUbicaciones: { [key: number]: { lat: number; lng: number; socketId?: string } } = {};
  
  newPackage = {
    direccion: ''
  };

  private socket!: Socket;
  private refreshInterval: any;

  constructor(
    private deliveryService: DeliveryService,
    private packagesService: PackagesService,
    private router: Router,
    private messageService: MessageService,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadUnassignedPackages();
    this.initSocket();
    this.startAutoRefresh();
    this.locationService.currentLocations.subscribe(locations => {
      this.repartidoresUbicaciones = locations;
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private lastUpdateTimes: { [key: number]: number } = {};

  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.loadDeliveries();
      this.loadUnassignedPackages();
    }, 30000); // Actualiza cada 30 segundos
  }


  private initSocket(): void {
    this.socket = io('https://72.60.31.237', {
    //this.socket = io('http://localhost:3000', {
      path: '/proyecto1/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Unirse a la sala admin
    this.socket.emit('join-admin');

    // Escuchar eventos de actualización
    this.socket.on('paquete_actualizado', () => {
      this.loadUnassignedPackages();
    });

    this.socket.on('repartidor_actualizado', () => {
      this.loadDeliveries();
    });

    // Unirse a la sala admin
    this.socket.emit('join-admin');

    // Recibir ubicación en tiempo real
    this.socket.on('ubicacion_repartidor', (data: { 
      deliveryId: number, 
      ubicacion: { latitud: number; longitud: number }, 
      timestamp: string 
    }) => {
      const now = Date.now();
      const lastUpdate = this.lastUpdateTimes[data.deliveryId] || 0;

      if (now - lastUpdate > 2000) {
        this.repartidoresUbicaciones[data.deliveryId] = {
          lat: Number(data.ubicacion.latitud),
          lng: Number(data.ubicacion.longitud)
        };
        this.repartidoresUbicaciones = { ...this.repartidoresUbicaciones }; // Forzar detección de cambios
        this.lastUpdateTimes[data.deliveryId] = now;

        console.log('📍 Ubicación actualizada:', this.repartidoresUbicaciones);
      }
    });

    // Pedir ubicaciones iniciales
    this.socket.emit('obtener_ubicaciones');

    // Recibir ubicaciones iniciales
    this.socket.on('ubicaciones_actuales', (ubicaciones: { 
      [key: number]: { latitud?: number; longitud?: number; lat?: string; lng?: string } 
    }) => {
      const ubicacionesConvertidas = Object.entries(ubicaciones).reduce((acc, [id, ub]) => {
        acc[Number(id)] = {
          lat: Number(ub.latitud ?? ub.lat),
          lng: Number(ub.longitud ?? ub.lng)
        };
        return acc;
      }, {} as { [key: number]: { lat: number; lng: number } });

      this.repartidoresUbicaciones = { ...ubicacionesConvertidas };
      console.log('📍 Ubicaciones iniciales procesadas:', this.repartidoresUbicaciones);
    });
  }


  loadDeliveries(): void {
    this.deliveryService.getDeliveries().subscribe({
      next: (response: any) => {
        this.deliverys = response.usuarios || [];
        
        // Actualizar ubicaciones de repartidores para el mapa
        const ubicaciones: { [key: number]: { lat: number; lng: number } } = {};
        
        this.deliverys.forEach(delivery => {
          if (delivery.lat && delivery.lng) {
            ubicaciones[delivery.id] = {
              lat: delivery.lat,
              lng: delivery.lng
            };
          }
        });
        
        this.locationService.updateLocations(ubicaciones);
      },
      error: (err) => {
        console.error('Error al cargar repartidores:', err);
        this.showError('No se pudieron cargar los repartidores');
      }
    });
  }

  loadUnassignedPackages(): void {
    this.packagesService.getPackages().subscribe({
      next: (response: any) => {
        this.unassignedPackages = (response.paquetes || []).filter((p: Package) => p.deliveryid === null);
      },
      error: (err) => {
        console.error('Error al cargar paquetes:', err);
        this.showError('No se pudieron cargar los paquetes');
      }
    });
  }

  showAddPackageDialog() {
    this.displayAddPackageDialog = true;
  }

  addPackage() {
    if (!this.newPackage.direccion) {
      this.showWarn('La dirección es requerida');
      return;
    }

    this.packagesService.addPackage(this.newPackage).subscribe({
      next: () => {
        this.showSuccess('Paquete añadido correctamente');
        this.displayAddPackageDialog = false;
        this.newPackage.direccion = '';
        this.loadUnassignedPackages();
      },
      error: (err) => {
        console.error('Error al añadir paquete:', err);
        this.showError('No se pudo añadir el paquete');
      }
    });
  }

  showAssignDialog(delivery: Delivery) {
    this.selectedDelivery = delivery;
    this.loadUnassignedPackages();
    this.displayAssignDialog = true;
  }

  assignPackage(pkg: Package) {
    if (!this.selectedDelivery || !pkg.id) return;

    this.packagesService.assignPackage(pkg.id, this.selectedDelivery.id).subscribe({
      next: () => {
        this.showSuccess('Paquete asignado correctamente');
        this.displayAssignDialog = false;
        this.selectedDelivery = null;
        this.loadUnassignedPackages();
      },
      error: (err) => {
        console.error('Error al asignar paquete:', err);
        this.showError('No se pudo asignar el paquete');
      }
    });
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_transit': return 'info';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  }

  getDeliveryStatusSeverity(status: string): string {
    switch (status) {
      case 'Disponible': return 'success';
      case 'Ocupado': return 'warning';
      case 'Inactivo': return 'danger';
      default: return 'info';
    }
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message,
      life: 3000
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 4000
    });
  }

  private showWarn(message: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: message,
      life: 3000
    });
  }

  IrInicio() {
    this.router.navigate(['/login']);
  }
}