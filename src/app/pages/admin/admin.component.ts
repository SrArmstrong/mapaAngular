import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PanelModule } from 'primeng/panel';
import { SplitterModule } from 'primeng/splitter';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-admin',
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
    ProgressSpinnerModule,
    PanelModule,
    SplitterModule
  ],
  providers: [MessageService],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})

export class AdminComponent implements OnInit, AfterViewInit {
  private map: any;
  deliverys: any[] = [];
  mapLoading = true;
  mapError = false;

  constructor(
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  tablaVisible = false;

  ngOnInit(): void {
    this.deliveryService.getDeliveries().subscribe({
      next: (response) => {
        
        this.deliverys = response.usuarios || [];

        // Opcional: Mostrar mensaje
        this.messageService.add({
          severity: 'success',
          summary: 'Usuarios cargados',
          detail: `${this.deliverys.length} usuarios encontrados`,
          life: 3000
        });
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios',
          life: 4000
        });
      }
    });

    // Si la tabla depende de esta flag para mostrarse con animación
    setTimeout(() => {
      this.tablaVisible = true;
    }, 100);
  }


  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => this.cdr.detectChanges(), 0);
    this.loadMap();
  }

  private async loadMap(): Promise<void> {
    try {
      const L = await import('leaflet');

      const iconRetinaUrl = 'assets/marker-icon-2x.png';
      const iconUrl = 'assets/marker-icon.png';
      const shadowUrl = 'assets/marker-shadow.png';

      const iconDefault = L.icon({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });

      L.Marker.prototype.options.icon = iconDefault;

      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        this.handleMapError('No se encontró el contenedor del mapa');
        return;
      }

      this.map = L.map(mapContainer, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([20.5888, -100.3899], 13);

      setTimeout(() => this.map.invalidateSize(), 0);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.map);

      L.marker([20.5888, -100.3899])
        .addTo(this.map)
        .bindPopup('Ubicación de Querétaro')
        .openPopup();

      this.mapLoading = false;
      this.mapError = false;

      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Mapa cargado',
          detail: 'El mapa se ha cargado correctamente',
          life: 3000
        });
      }, 300);

    } catch (error) {
      this.handleMapError('No se pudo cargar el mapa');
      console.error(error);
    }
  }

  private handleMapError(msg: string) {
    this.mapError = true;
    this.mapLoading = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error de Mapa',
      detail: msg,
      life: 4000
    });
  }

  IrInicio() {
    this.router.navigate(['/login']);
  }

  addPaquete() {
    this.messageService.add({
      severity: 'info',
      summary: 'Paquete añadido',
      detail: 'El paquete se ha añadido correctamente',
      life: 3000
    });
  }
}
