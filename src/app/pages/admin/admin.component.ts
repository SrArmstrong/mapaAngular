import { Component, OnInit } from '@angular/core';
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
export class AdminComponent implements OnInit {
  deliverys: Delivery[] = [];
  unassignedPackages: Package[] = [];
  selectedDelivery: Delivery | null = null;
  displayAddPackageDialog = false;
  displayAssignDialog = false;

    // Agregar estos nuevos métodos:
  getStatusSeverity(status: string): string {
    switch (status) {
      case 'En espera':
        return 'warning';
      case 'En camino':
        return 'info';
      case 'Entregado':
        return 'success';
      case 'Cancelado':
        return 'danger';
      default:
        return 'info';
    }
  }

  getDeliveryStatusSeverity(status: string): string {
    switch (status) {
      case 'Disponible':
        return 'success';
      case 'Ocupado':
        return 'warning';
      case 'Inactivo':
        return 'danger';
      default:
        return 'info';
    }
  }
  
  newPackage = {
    direccion: ''
  };

  constructor(
    private deliveryService: DeliveryService,
    private packagesService: PackagesService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.deliveryService.getDeliveries().subscribe({
      next: (response) => {
        this.deliverys = response.usuarios || [];
      },
      error: (err) => {
        console.error('Error al cargar repartidores:', err);
        this.showError('No se pudieron cargar los repartidores');
      }
    });
  }

  loadUnassignedPackages(): void {
    this.packagesService.getPackages().subscribe({
      next: (response) => {
        this.unassignedPackages = response.paquetes || [];
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
      next: (response) => {
        this.showSuccess('Paquete añadido correctamente');
        this.displayAddPackageDialog = false;
        this.newPackage = { direccion: '' };
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

  assignPackage(packageId: number) {
    if (!this.selectedDelivery) return;

    this.packagesService.assignPackage(packageId, this.selectedDelivery.id).subscribe({
      next: (response) => {
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