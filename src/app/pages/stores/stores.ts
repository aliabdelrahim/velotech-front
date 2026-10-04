import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreService, StoreDetailsDto } from '../../services/store';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

// Leaflet est charge depuis index.html en global
declare const L: any;

interface StoreWithGeo extends StoreDetailsDto {
  city: string;
  zip: string;
  lat: number;
  lng: number;
}

// Geocoding pragmatique : mapping code postal -> coordonnees
// Couvre les principales villes Velotech
const ZIP_COORDS: Record<string, [number, number, string]> = {
  '1000': [50.8503, 4.3517, 'Bruxelles'],
  '1030': [50.8676, 4.3833, 'Schaerbeek'],
  '1040': [50.8362, 4.3826, 'Etterbeek'],
  '1050': [50.8273, 4.3683, 'Ixelles'],
  '1060': [50.8276, 4.3441, 'Saint-Gilles'],
  '1070': [50.8364, 4.3060, 'Anderlecht'],
  '1080': [50.8556, 4.3325, 'Molenbeek'],
  '1090': [50.8800, 4.3300, 'Jette'],
  '1150': [50.8408, 4.4347, 'Woluwe-Saint-Pierre'],
  '1180': [50.8016, 4.3437, 'Uccle'],
  '1190': [50.8147, 4.3203, 'Forest'],
  '2000': [51.2194, 4.4025, 'Anvers'],
  '2800': [51.0286, 4.4775, 'Malines'],
  '3000': [50.8798, 4.7005, 'Louvain'],
  '3500': [50.9307, 5.3378, 'Hasselt'],
  '3600': [50.9650, 5.5000, 'Genk'],
  '4000': [50.6326, 5.5797, 'Liege'],
  '4100': [50.6037, 5.5050, 'Seraing'],
  '4800': [50.5882, 5.8624, 'Verviers'],
  '5000': [50.4674, 4.8718, 'Namur'],
  '6000': [50.4108, 4.4446, 'Charleroi'],
  '7000': [50.4542, 3.9525, 'Mons'],
  '7100': [50.4760, 4.1859, 'La Louviere'],
  '7500': [50.6056, 3.3886, 'Tournai'],
  '7700': [50.7378, 3.2117, 'Mouscron'],
  '8000': [51.2093, 3.2247, 'Bruges'],
  '8400': [51.2247, 2.9156, 'Ostende'],
  '8500': [50.8278, 3.2647, 'Courtrai'],
  '8800': [50.9469, 3.1226, 'Roulers'],
  '9000': [51.0500, 3.7303, 'Gand'],
};

// Coordonnees fallback : centre de Bruxelles
const FALLBACK: [number, number] = [50.8503, 4.3517];
const FALLBACK_CITY = 'Belgique';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './stores.html',
  styleUrl: './stores.scss',
})
export class StoresComponent implements OnInit, AfterViewInit, OnDestroy {
  private storeService = inject(StoreService);
  private i18n = inject(TranslateService);

  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;
  private map: any;
  private markers: any[] = [];

  stores = signal<StoreWithGeo[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  selectedId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.stores();
    return this.stores().filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.zip.includes(q)
    );
  });

  ngOnInit(): void {
    this.storeService.getAll().subscribe({
      next: (list) => {
        this.stores.set(list.map((s) => this.geocode(s)));
        this.loading.set(false);
        setTimeout(() => this.refreshMarkers(), 0);
      },
      error: () => {
        this.errorMsg.set(this.i18n.instant('STORES.LOAD_ERROR'));
        this.loading.set(false);
      },
    });
  }

  ngAfterViewInit(): void {
    // Attente que Leaflet soit charge (script defer en index.html)
    this.initMapWhenReady();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMapWhenReady(retries = 30): void {
    if (typeof L === 'undefined') {
      if (retries === 0) return;
      setTimeout(() => this.initMapWhenReady(retries - 1), 100);
      return;
    }
    if (!this.mapEl) return;

    this.map = L.map(this.mapEl.nativeElement, {
      center: [50.85, 4.5],
      zoom: 8,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(this.map);

    this.refreshMarkers();
  }

  private refreshMarkers(): void {
    if (!this.map || typeof L === 'undefined') return;

    // Nettoie anciens marqueurs
    for (const m of this.markers) {
      this.map.removeLayer(m);
    }
    this.markers = [];

    const items = this.filtered();
    const bounds: [number, number][] = [];

    for (const s of items) {
      const marker = L.marker([s.lat, s.lng]).addTo(this.map);
      const viewCatalog = this.i18n.instant('STORES.VIEW_CATALOG');
      marker.bindPopup(
        `<strong>${s.name}</strong><br>${s.address}<br><a href="/catalog/${s.id}">${viewCatalog}</a>`
      );
      marker.on('click', () => this.selectedId.set(s.id));
      this.markers.push(marker);
      bounds.push([s.lat, s.lng]);
    }

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }

  private geocode(s: StoreDetailsDto): StoreWithGeo {
    const zipMatch = s.address.match(/\b(\d{4})\b/);
    const zip = zipMatch ? zipMatch[1] : '';
    const entry = ZIP_COORDS[zip];
    return {
      ...s,
      zip,
      city: entry ? entry[2] : FALLBACK_CITY,
      lat: entry ? entry[0] : FALLBACK[0],
      lng: entry ? entry[1] : FALLBACK[1],
    };
  }

  selectStore(s: StoreWithGeo): void {
    this.selectedId.set(s.id);
    if (this.map) {
      this.map.setView([s.lat, s.lng], 13);
      const marker = this.markers.find(
        (m: any) => m.getLatLng().lat === s.lat && m.getLatLng().lng === s.lng
      );
      if (marker) marker.openPopup();
    }
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    setTimeout(() => this.refreshMarkers(), 0);
  }
}
