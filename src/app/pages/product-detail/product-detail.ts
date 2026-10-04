import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductService, ProductDetailsDto, parseImageUrls } from '../../services/product';
import { CartService } from '../../services/cart';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

/**
 * Tailles disponibles selon le produit.
 * On detecte d'abord par TYPE, puis on retombe sur des mots-cles du NOM
 * (car le DbSeeder regroupe casques + antivols dans le type generique "Accessory").
 */
const BIKE_TYPES = [
  'Velo route', 'VTT', 'Velo electrique', 'Velo ville', 'Velo enfant',
  'Velo cargo', 'BMX', 'Velo pliable', 'Gravel',
  'Bike', // tag generique du seeder
];
const HELMET_TYPES = ['Casque', 'Helmet'];
const APPAREL_TYPES = ['Equipement', 'Apparel', 'Vetement'];

// Detection par mot-cle dans le nom (fallback quand le type est trop generique)
const HELMET_KEYWORDS = ['casque', 'helmet'];
const APPAREL_KEYWORDS = ['gants', 'maillot', 'cuissard', 'veste', 'chaussures', 'bonnet', 'manchettes', 'jambieres', 'surchaussures', 'short', 'pantalon'];

const SIZES_BIKE = ['S', 'M', 'L', 'XL'] as const;
const SIZES_HELMET = ['S', 'M', 'L', 'XL'] as const;
const SIZES_APPAREL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

type SizeCategory = 'bike' | 'helmet' | 'apparel' | 'none';

function detectCategory(type: string, name: string): SizeCategory {
  const t = (type ?? '').trim();
  const n = (name ?? '').toLowerCase();

  // 1) par type explicite
  if (BIKE_TYPES.includes(t)) return 'bike';
  if (HELMET_TYPES.includes(t)) return 'helmet';
  if (APPAREL_TYPES.includes(t)) return 'apparel';

  // 2) fallback par mot-cle du nom (utile quand type === "Accessory")
  if (HELMET_KEYWORDS.some((k) => n.includes(k))) return 'helmet';
  if (APPAREL_KEYWORDS.some((k) => n.includes(k))) return 'apparel';

  return 'none';
}

type Size = string;

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cart = inject(CartService);
  private i18n = inject(TranslateService);

  product = signal<ProductDetailsDto | null>(null);
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  selectedSize = signal<Size | null>(null);
  selectedTab = signal<'description' | 'specs' | 'reviews' | 'shipping'>('description');
  addedToCart = signal(false);

  /** Index de l'image actuellement affichee dans la galerie. */
  selectedImageIndex = signal(0);

  /** Liste des URLs d'images du produit courant. */
  images = computed<string[]>(() => parseImageUrls(this.product()?.imageUrls));

  /** URL de l'image principale (celle actuellement selectionnee). */
  mainImage = computed<string | null>(() => {
    const list = this.images();
    const idx = this.selectedImageIndex();
    return list.length > 0 ? list[Math.min(idx, list.length - 1)] : null;
  });

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  /** Categorie (bike/helmet/apparel/none) deduite du produit. */
  private category = computed<SizeCategory>(() => {
    const p = this.product();
    return p ? detectCategory(p.type ?? '', p.name ?? '') : 'none';
  });

  /** Tailles disponibles selon le produit (vide si pas de taille). */
  sizes = computed<readonly string[]>(() => {
    switch (this.category()) {
      case 'bike': return SIZES_BIKE;
      case 'helmet': return SIZES_HELMET;
      case 'apparel': return SIZES_APPAREL;
      default: return [];
    }
  });

  /** Libelle affiche au-dessus du selecteur. */
  sizeLabel = computed<string>(() => {
    switch (this.category()) {
      case 'helmet': return this.i18n.instant('PRODUCT.SIZE_LABEL_HELMET');
      case 'apparel': return this.i18n.instant('PRODUCT.SIZE_LABEL_APPAREL');
      case 'bike': return this.i18n.instant('PRODUCT.SIZE_LABEL_BIKE');
      default: return this.i18n.instant('PRODUCT.SIZE_LABEL_DEFAULT');
    }
  });

  hasSizes = computed(() => this.sizes().length > 0);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.router.navigate(['/catalog/1']);
        return;
      }
      this.loadProduct(id);
    });
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.productService.getProductById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        // Initialise la taille selectionnee si le produit en a
        const sizes = this.sizes();
        if (sizes.length > 0) {
          // Choisit la taille du milieu par defaut (M pour bike/helmet, M pour apparel)
          const defaultSize = sizes.includes('M' as never) ? 'M' : sizes[Math.floor(sizes.length / 2)];
          this.selectedSize.set(defaultSize);
        } else {
          this.selectedSize.set(null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set(this.i18n.instant('PRODUCT.NOT_FOUND'));
        this.loading.set(false);
      },
    });
  }

  selectSize(s: Size): void {
    this.selectedSize.set(s);
  }

  selectTab(t: 'description' | 'specs' | 'reviews' | 'shipping'): void {
    this.selectedTab.set(t);
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    const size = this.selectedSize() ?? undefined;
    this.cart.add({
      productId: p.id,
      name: p.name,
      type: p.type,
      priceSale: p.priceSale,
      size,
      quantity: 1,
    });
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2500);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}
