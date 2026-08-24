import { Component } from 'react';
import PropTypes from 'prop-types';

export default class AppErrorBoundary extends Component {
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  state = { hasError: false };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-paper px-6 py-16 text-center text-ink" dir="rtl">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">حدث خطأ غير متوقع</h1>
          <p className="mb-6 text-text-secondary">
            تعذّر عرض هذه الصفحة حالياً. أعد تحميل الصفحة للمحاولة مرة أخرى.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-xl bg-registry-green px-5 py-3 font-medium text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-registry-green focus:ring-offset-2"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </main>
    );
  }
}

AppErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
