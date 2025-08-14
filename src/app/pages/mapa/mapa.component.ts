import { Component, OnInit, AfterViewInit, Input, ChangeDetectorRef, Inject, PLATFORM_ID, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LocationService } from '../../services/location.service';
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
  
  @Input() initialCoords: [number, number] = [20.5888, -100.3899];
  @Input() initialZoom: number = 13;
  @Input() currentLocation: { lat: number; lng: number } | null = null;
  @Input() deliveryLocations: { [key: number]: { lat: number; lng: number; username?: string; state?: string } } = {};

  mapLoading = true;
  mapError = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private locationService: LocationService
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadMap();
    
    // Suscribirse a actualizaciones de ubicación
    this.locationService.currentLocations.subscribe(locations => {
      this.deliveryLocations = locations;
      this.updateDeliveryMarkers();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentLocation'] && this.currentLocation && this.map) {
      
      setTimeout(() => {
        this.updateCurrentMarker();
      }, 0);
    }

    if (changes['deliveryLocations'] && this.currentLocation && this.map) {
      this.updateDeliveryMarkers();
    }

  }

  private async loadMap(): Promise<void> {
    try {
      const leaflet = await import('leaflet');
      const L = leaflet.default ?? leaflet;

      // 🔹 Necesario para que Angular encuentre los iconos por defecto
      (L.Icon.Default as any).mergeOptions({
        iconRetinaUrl: 'assets/marker-icon-2x.png',
        iconUrl: 'assets/marker.png',
        shadowUrl: 'assets/marker-shadow.png'
      });

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


  private updateCurrentMarker(): void {
    if (!this.map) return;

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
        // Configuración del icono personalizado
        const deliveryIcon = L.icon({
          iconUrl: 'assets/delivery-icon.png',  // Ruta a tu icono de carrito
          iconSize: [32, 32], // Tamaño del icono (ajustar según necesidad)
          iconAnchor: [16, 32], // Punto de anclaje
          popupAnchor: [0, -32], // Posición del popup
          className: 'delivery-marker' // Clase CSS opcional
        });

        // Crear el marcador con estilos personalizados
        this.markers[deliveryId] = L.marker(position, { 
          icon: deliveryIcon,
          zIndexOffset: 1000 // Para asegurar que estén sobre otros marcadores
        })
        .addTo(this.map)
        .bindPopup(`
          <div class="delivery-popup">
            <strong>${location.username || 'Repartidor'}</strong>
            <div>ID: ${deliveryId}</div>
            <div>Estado: ${location.state || 'Disponible'}</div>
          </div>
        `, {
          className: 'delivery-popup-style', // Clase CSS para el popup
          maxWidth: 250,
          minWidth: 100
        });
        
        // Opcional: Abrir popup automáticamente
        // this.markers[deliveryId].openPopup();
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