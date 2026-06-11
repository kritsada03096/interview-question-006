import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ProductCode {
  id: number;
  formattedCode: string;
  code: string;
  createdAt: string;
}

interface BarcodeSegment {
  width: number;
  isBar: boolean;
}

const CODE39_PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '*': 'nwnnwnwnn'
};

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = '/api/product-codes';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly codes = signal<ProductCode[]>([]);
  protected readonly codeInput = signal('');
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly codeTouched = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected selectedDeleteCode: ProductCode | null = null;

  protected readonly normalizedInput = computed(() => this.codeInput().replaceAll('-', ''));
  protected readonly formattedPreview = computed(() => this.formatCode(this.normalizedInput()));
  protected readonly isCodeValid = computed(() => /^[A-Z0-9]{16}$/.test(this.normalizedInput()));
  protected readonly shouldShowCodeError = computed(() => this.codeTouched() && !this.isCodeValid());
  protected readonly previewSegments = computed(() => this.buildCode39(this.normalizedInput()));

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCodes();
    }
  }

  protected loadCodes(): void {
    this.loading.set(true);
    this.error.set('');

    this.http.get<ProductCode[]>(this.apiUrl).subscribe({
      next: (codes) => {
        this.codes.set(codes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบว่า backend ทำงานอยู่ที่ http://localhost:5137');
        this.loading.set(false);
      }
    });
  }

  protected onCodeInput(value: string): void {
    const normalized = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 16);

    this.codeTouched.set(true);
    this.codeInput.set(this.formatCode(normalized));
    this.message.set('');
    this.error.set('');
  }

  protected addCode(): void {
    this.codeTouched.set(true);

    if (this.saving()) {
      return;
    }

    if (!this.isCodeValid()) {
      this.error.set('กรุณากรอกรหัสสินค้าให้ครบ 16 ตัว โดยใช้ A-Z หรือ 0-9 เท่านั้น');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    this.http.post<ProductCode>(this.apiUrl, { code: this.normalizedInput() }).subscribe({
      next: (code) => {
        this.codes.update((codes) => [code, ...codes]);
        this.codeInput.set('');
        this.codeTouched.set(false);
        this.showSuccess('เพิ่มรหัสสินค้าเรียบร้อย');
        this.saving.set(false);
      },
      error: (response: HttpErrorResponse) => {
        this.error.set(response.error?.message ?? 'ไม่สามารถเพิ่มข้อมูลได้');
        this.saving.set(false);
      }
    });
  }

  protected deleteCode(code: ProductCode): void {
    this.selectedDeleteCode = code;
    this.message.set('');
    this.error.set('');
  }

  protected closeDeleteModal(): void {
    if (this.deletingId() !== null) {
      return;
    }

    this.selectedDeleteCode = null;
  }

  protected confirmDelete(): void {
    const code = this.selectedDeleteCode;
    if (!code || this.deletingId() !== null) {
      return;
    }

    this.deletingId.set(code.id);
    this.error.set('');
    this.message.set('');

    this.http.delete(`${this.apiUrl}/${code.id}`).subscribe({
      next: () => {
        this.codes.update((codes) => codes.filter((item) => item.id !== code.id));
        this.showSuccess('ลบรหัสสินค้าเรียบร้อย');
        this.deletingId.set(null);
        this.selectedDeleteCode = null;
      },
      error: () => {
        this.error.set('ไม่สามารถลบข้อมูลได้');
        this.deletingId.set(null);
      }
    });
  }

  protected clearMessage(): void {
    this.message.set('');
    this.clearToastTimer();
  }

  protected buildCode39(value: string): BarcodeSegment[] {
    const encoded = `*${value || '0000000000000000'}*`;
    const segments: BarcodeSegment[] = [];

    for (const [charIndex, char] of Array.from(encoded).entries()) {
      const pattern = CODE39_PATTERNS[char];
      if (!pattern) {
        continue;
      }

      for (const [index, widthCode] of Array.from(pattern).entries()) {
        segments.push({
          width: widthCode === 'w' ? 3 : 1,
          isBar: index % 2 === 0
        });
      }

      if (charIndex < encoded.length - 1) {
        segments.push({ width: 1, isBar: false });
      }
    }

    return segments;
  }

  private formatCode(value: string): string {
    return value.match(/.{1,4}/g)?.join('-') ?? '';
  }

  private showSuccess(message: string): void {
    this.clearToastTimer();
    this.message.set(message);
    this.toastTimer = setTimeout(() => {
      this.message.set('');
      this.toastTimer = null;
    }, 2500);
  }

  private clearToastTimer(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }
}
