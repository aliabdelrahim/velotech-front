import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { guestGuard } from './guest-guard';
import { AuthService } from '../services/auth';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('guestGuard', () => {
  let routerSpy: { navigateByUrl: ReturnType<typeof vi.fn> };

  const executeGuard: CanActivateFn = (...params) =>
    TestBed.runInInjectionContext(() => guestGuard(...params));

  beforeEach(() => {
    localStorage.clear();
    routerSpy = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  it('returns true when user is NOT logged in (guest)', () => {
    const result = executeGuard({} as any, {} as any);
    expect(result).toBe(true);
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });

  it('redirects authenticated user to /dashboard', () => {
    localStorage.setItem('token', 'jwt.token.here');
    const result = executeGuard({} as any, {} as any);
    expect(result).toBe(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
