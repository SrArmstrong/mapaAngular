import { Component, OnInit, AfterViewInit, Input, ChangeDetectorRef, Inject, PLATFORM_ID, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';

declare let L: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    ButtonModule
  ],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})

export class MapComponent implements AfterViewInit, OnChanges {
  private map: any;
  private markers: { [key: number]: any } = {};
  private currentMarker: any;
  private deliveryIcon: any;
  private disconnectedIcon: any;
  
  @Input() initialCoords: [number, number] = [20.5888, -100.3899];
  @Input() initialZoom: number = 13;
  @Input() currentLocation: { lat: number; lng: number } | null = null;
  @Input() deliveryLocations: { [key: number]: { lat: number; lng: number } } = {};

  mapLoading = true;
  mapError = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentLocation'] && this.currentLocation && this.map) {
      this.updateCurrentMarker();
    }
    if (changes['deliveryLocations'] && this.map) {
      this.updateDeliveryMarkers();
    }
  }

  private async loadMap(): Promise<void> {
    try {
      const L = await import('leaflet');
      
      this.setupCustomIcons(L);

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
      }).setView(this.initialCoords, this.initialZoom);

      setTimeout(() => this.map.invalidateSize(), 0);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.map);

      // Crear marcador inicial
      this.updateCurrentMarker();
      this.updateDeliveryMarkers();

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

  private setupCustomIcons(L: any): void {
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';

    // Icono para repartidores conectados
    this.deliveryIcon = L.icon({
      iconUrl: 'assets/delivery-icon.png', // Crea o usa un icono diferente
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Icono para repartidores desconectados (opcional)
    this.disconnectedIcon = L.icon({
      iconUrl: 'assets/disconnected-icon.png', // Icono gris o diferente
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Icono por defecto para la ubicación actual
    L.Marker.prototype.options.icon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
  }

  private updateCurrentMarker(): void {
    if (!this.map) return;

    // Eliminar marcadores antiguos
    Object.keys(this.markers).forEach(id => {
      const numericId = Number(id);
      if (!this.deliveryLocations[numericId]) {
        this.map.removeLayer(this.markers[numericId]);
        delete this.markers[numericId];
      }
    });

    // Añadir/actualizar marcadores
    Object.entries(this.deliveryLocations).forEach(([id, location]) => {
      const deliveryId = Number(id);
      const position = [location.lat, location.lng];

      if (this.markers[deliveryId]) {
        this.markers[deliveryId].setLatLng(position);
      } else {
        this.markers[deliveryId] = L.marker(position, {
          icon: this.deliveryIcon // Usar icono personalizado
        })
        .addTo(this.map)
        .bindPopup(`Repartidor ${deliveryId}`)
        .openPopup();
      }
    });
    
    const position = this.currentLocation ? 
      [this.currentLocation.lat, this.currentLocation.lng] : 
      this.initialCoords;

    if (this.currentMarker) {
      this.currentMarker.setLatLng(position);
    } else {
      this.currentMarker = L.marker(position)
        .addTo(this.map)
        .bindPopup(this.currentLocation ? 'Tu ubicación actual' : 'Ubicación inicial')
        .openPopup();
    }

    if (this.currentLocation) {
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], this.initialZoom);
    }
  }

  private updateDeliveryMarkers(): void {
    if (!this.map) return;

    // Eliminar marcadores antiguos que ya no están en deliveryLocations
    Object.keys(this.markers).forEach(id => {
      if (!this.deliveryLocations[Number(id)]) {
        const numericId = Number(id);
        this.map.removeLayer(this.markers[numericId]);
        delete this.markers[numericId];
      }
    });

    // Añadir/actualizar marcadores
    Object.entries(this.deliveryLocations).forEach(([id, location]) => {
      const deliveryId = Number(id);
      const position = [location.lat, location.lng];

      if (this.markers[deliveryId]) {
        this.markers[deliveryId].setLatLng(position);
      } else {
        this.markers[deliveryId] = L.marker(position)
          .addTo(this.map)
          .bindPopup(`Repartidor ${deliveryId}`)
          .openPopup();
      }
    });
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
    this.cdr.detectChanges();
  }

  reloadMap() {
    this.mapLoading = true;
    this.mapError = false;
    this.loadMap();
    this.cdr.detectChanges();
  }
}