import React from "react";

// Wraps client contact data (phone numbers, etc.) shown to employees so it
// can't be selected, copied, cut, or grabbed via right-click "Copy" — the
// number stays fully visible (an employee needs to read it to do their job),
// this only blocks the couple of easy ways to lift it out of the page.
// Not a hard security boundary (view-source/devtools can still see it) —
// just closes the casual-copy paths, same intent as the request.
export default function ProtectedText({ as: Tag = "span", className = "", children, ...rest }) {
  const block = (e) => e.preventDefault();
  return (
    <Tag
      className={`select-none ${className}`}
      onCopy={block}
      onCut={block}
      onContextMenu={block}
      onDragStart={block}
      {...rest}
    >
      {children}
    </Tag>
  );
}
