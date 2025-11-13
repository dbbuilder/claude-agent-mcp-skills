// Test fixture: XSS vulnerabilities in React

import React from 'react';

// VULNERABLE: dangerouslySetInnerHTML
export function DangerousComponent({ userInput }: { userInput: string }) {
  return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
}

// VULNERABLE: Direct innerHTML manipulation
export function UnsafeComponent({ content }: { content: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = content;
    }
  }, [content]);
  return <div ref={ref} />;
}

// SAFE: React escapes by default
export function SafeComponent({ userInput }: { userInput: string }) {
  return <div>{userInput}</div>;
}
