import PropTypes from 'prop-types';
import { useState } from 'react';
import Button from './Button';
import Drawer from './Drawer';

export default function FilterBar({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden mb-4">
        <Button variant="secondary" onClick={() => setIsDrawerOpen(true)} className="w-full justify-center">
          عرض عوامل التصفية
        </Button>
      </div>
      <div className="hidden lg:block mb-6 rounded-xl border border-border bg-surface p-4">
        {children}
      </div>
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="عوامل التصفية">
        {children}
      </Drawer>
    </>
  );
}

FilterBar.propTypes = {
  children: PropTypes.node.isRequired
};
