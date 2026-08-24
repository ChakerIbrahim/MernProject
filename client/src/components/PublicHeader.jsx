import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-1 focus-visible:outline-registry-green">
          <Logo className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link to="/login" className="-my-3 inline-block px-2 sm:px-4 py-3 text-sm font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">تسجيل الدخول</Link>
          <Link to="/register/organization" className="hidden rounded-md bg-registry-green/10 px-4 py-2 text-sm font-medium text-registry-green hover:bg-registry-green/20 focus-visible:outline-1 focus-visible:outline-registry-green sm:inline-block">إنشاء حساب مؤسسة</Link>
        </div>
      </div>
    </header>
  );
}
