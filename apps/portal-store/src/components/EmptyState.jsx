/** Empty state component for no-data screens. */
import React from 'react';
export default function EmptyState({message='No data found'}){ return <p style={{color:'#6b7280'}}>{message}</p>; }
