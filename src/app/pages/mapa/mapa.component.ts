import { Component, OnInit, AfterViewInit, Input, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';

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
export class MapComponent implements AfterViewInit {
  private map: any;
  @Input() initialCoords: [number, number] = [20.5888, -100.3899];
  @Input() initialZoom: number = 13;
  
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
      }).setView(this.initialCoords, this.initialZoom);

      setTimeout(() => this.map.invalidateSize(), 0);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.map);

      L.marker(this.initialCoords)
        .addTo(this.map)
        .bindPopup('Ubicación inicial')
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

  reloadMap() {
    this.mapLoading = true;
    this.mapError = false;
    this.loadMap();
  }
}
