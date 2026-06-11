import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

const apiUrl = '/api/product-codes';

const productCode = {
  id: 1,
  formattedCode: 'ABCD-1234-EFGH-5678',
  code: 'ABCD1234EFGH5678',
  createdAt: '2026-06-11T10:00:00Z',
};

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function createApp(initialCodes: unknown[] = []) {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      loadCodes(): void;
    };

    fixture.detectChanges();
    component.loadCodes();
    httpMock.expectOne(apiUrl).flush(initialCodes);
    fixture.detectChanges();

    return fixture;
  }

  function setProductCodeInput(element: HTMLElement, value: string): void {
    const input = element.querySelector<HTMLInputElement>('#product-code');
    expect(input).toBeTruthy();

    input!.value = value;
    input!.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function submitForm(element: HTMLElement): void {
    const form = element.querySelector<HTMLFormElement>('form');
    expect(form).toBeTruthy();

    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  it('should create the app and load product codes', () => {
    const fixture = createApp();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render product code form', () => {
    const fixture = createApp();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('จัดการรหัสสินค้า');
    expect(compiled.querySelector('input')?.getAttribute('placeholder')).toBe('ABCD-1234-EFGH-5678');
  });

  it('should show validation error and not call API when code is invalid', () => {
    const fixture = createApp();
    const compiled = fixture.nativeElement as HTMLElement;

    setProductCodeInput(compiled, 'ABCD-1234');
    fixture.detectChanges();
    submitForm(compiled);
    fixture.detectChanges();

    expect(compiled.querySelector('#product-code')?.classList).toContain('input-invalid');
    expect(compiled.querySelector('.field-error')?.textContent).toContain('16');
    httpMock.expectNone(apiUrl);
  });

  it('should add product code and show success toast', () => {
    const fixture = createApp();
    const compiled = fixture.nativeElement as HTMLElement;
    const component = fixture.componentInstance as unknown as {
      onCodeInput(value: string): void;
      addCode(): void;
    };

    component.onCodeInput('ABCD-1234-EFGH-5678');
    fixture.detectChanges();
    component.addCode();

    const request = httpMock.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ code: 'ABCD1234EFGH5678' });

    request.flush(productCode);
    fixture.detectChanges();

    expect(compiled.querySelector('tbody')?.textContent).toContain('ABCD-1234-EFGH-5678');
    expect(compiled.querySelector('.toast')?.textContent).toContain('เพิ่มรหัสสินค้าเรียบร้อย');
  });

  it('should open delete modal and delete product code after confirmation', () => {
    const fixture = createApp([productCode]);
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.danger-button')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('[role="dialog"]')?.textContent).toContain('ยืนยันการลบ');

    compiled.querySelector<HTMLButtonElement>('.confirm-delete-button')?.click();

    const request = httpMock.expectOne(`${apiUrl}/1`);
    expect(request.request.method).toBe('DELETE');

    request.flush(null);
    fixture.detectChanges();

    expect(compiled.querySelector('tbody')?.textContent ?? '').not.toContain('ABCD-1234-EFGH-5678');
    expect(compiled.querySelector('.toast')?.textContent).toContain('ลบรหัสสินค้าเรียบร้อย');
  });
});
