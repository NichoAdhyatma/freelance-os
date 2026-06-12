// Radix Visually Hidden — accessible but visually hidden (sr-only pattern)
import * as React from 'react';

const VISUALLY_HIDDEN_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
};

export function VisuallyHidden({
  children,
  asChild,
  ...props
}: {
  children?: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(children) as React.ReactElement<{ style?: React.CSSProperties }>;
    return React.cloneElement(child, {
      style: { ...VISUALLY_HIDDEN_STYLE, ...child.props.style },
    });
  }
  return (
    <span style={VISUALLY_HIDDEN_STYLE} {...props}>
      {children}
    </span>
  );
}