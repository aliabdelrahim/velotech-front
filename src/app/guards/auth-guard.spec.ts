import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('authGuard', () => {
  let auth: AuthService;
  let routerSpy: { navigateByUrl: ReturnType<typeof vi.fn> };

  const executeGuard: CanActivateFn = (...params) =>
    TestBed.runInInjectionContext(() => authGuard(...params));

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
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  it('returns true when user is logged in', () => {
    localStorage.setItem('token', 'fake.jwt.token');
    expect(auth.isLoggedIn()).toBe(true);
    const result = executeGuard({} as any, {} as any);
    expect(result).toBe(true);
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });

  it('redirects to /login when not logged in', () => {
    const result = executeGuard({} as any, {} as any);
    expect(result).toBe(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
