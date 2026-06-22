import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService, AuthResultDto } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isLoggedIn() returns false when no token', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('login() stores token, userId, role and storeId in localStorage', (done) => {
    const fakeResponse: AuthResultDto = {
      token: 'abc.def.ghi',
      expiresAtUtc: '2026-12-31T00:00:00Z',
      userId: 42,
      role: 'Manager',
      storeId: 7,
    };

    service.login({ email: 'a@b.com', password: 'pwd' }).subscribe((res) => {
      expect(res).toEqual(fakeResponse);
      expect(localStorage.getItem('token')).toBe('abc.def.ghi');
      expect(localStorage.getItem('userId')).toBe('42');
      expect(localStorage.getItem('role')).toBe('Manager');
      expect(localStorage.getItem('storeId')).toBe('7');
      expect(service.isLoggedIn()).toBe(true);
      expect(service.getRole()).toBe('Manager');
      done();
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/login'));
    expect(req.request.method).toBe('POST');
    req.flush(fakeResponse);
  });

  it('login() does NOT store storeId when null (client)', (done) => {
    const fakeResponse: AuthResultDto = {
      token: 't',
      expiresAtUtc: '2026-12-31T00:00:00Z',
      userId: 1,
      role: 'Client',
      storeId: null,
    };

    service.login({ email: 'c@b.com', password: 'pwd' }).subscribe(() => {
      expect(localStorage.getItem('storeId')).toBeNull();
      done();
    });

    httpMock.expectOne((r) => r.url.endsWith('/auth/login')).flush(fakeResponse);
  });

  it('register() POSTs to /auth/register', (done) => {
    service
      .register({ name: 'Test', email: 't@t.com', password: 'azerty' })
      .subscribe((res) => {
        expect(res.userId).toBe(99);
        done();
      });

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/register'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Test',
      email: 't@t.com',
      password: 'azerty',
    });
    req.flush({ message: 'ok', userId: 99 });
  });

  it('logout() removes all auth keys from localStorage', () => {
    localStorage.setItem('token', 'x');
    localStorage.setItem('userId', '1');
    localStorage.setItem('role', 'Client');
    localStorage.setItem('storeId', '3');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('storeId')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('forgotPassword() POSTs to /auth/forgot-password', (done) => {
    service.forgotPassword('lost@user.com').subscribe((res) => {
      expect(res.message).toBeTruthy();
      done();
    });
    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/forgot-password'));
    expect(req.request.body).toEqual({ email: 'lost@user.com' });
    req.flush({ message: 'If the email exists, a reset link has been sent.' });
  });

  it('resetPassword() POSTs to /auth/reset-password', (done) => {
    service.resetPassword('TOK123', 'newpass').subscribe((res) => {
      expect(res.message).toBeTruthy();
      done();
    });
    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/reset-password'));
    expect(req.request.body).toEqual({ token: 'TOK123', newPassword: 'newpass' });
    req.flush({ message: 'ok' });
  });
});
