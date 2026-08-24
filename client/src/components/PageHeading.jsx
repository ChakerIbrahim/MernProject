import React from 'react';

export default function PageHeading({ title }) {
  return (
    <h1 className="text-3xl font-bold font-display text-ink pb-2 border-b-3 border-registry-green inline-block mb-6">
      {title}
    </h1>
  );
}
