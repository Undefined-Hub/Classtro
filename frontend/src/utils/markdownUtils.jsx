import React from "react";

/**
 * Utility functions for rendering markdown formatted text
 * Supports: **bold**, *italic*, ***bold-italic***, `code`
 */

/**
 * Parse markdown text and return formatted component children
 * Converts markdown syntax to HTML inline elements
 */
export const parseMarkdown = (text) => {
  if (!text) return "";

  // Split text into parts, preserving the delimiters
  const parts = [];
  let currentPos = 0;

  // Regex to match: **bold**, *italic*, `code`
  // Order matters: check *** before **, check ** before *, check ` separately
  const patterns = [
    { regex: /\*\*\*(.+?)\*\*\*/g, tag: "bold-italic" },
    { regex: /\*\*(.+?)\*\*/g, tag: "bold" },
    { regex: /\*(.+?)\*/g, tag: "italic" },
    { regex: /`(.+?)`/g, tag: "code" },
  ];

  // Create a map of all matches with their positions
  const matches = [];

  patterns.forEach(({ regex, tag }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        tag,
        text: match[1],
      });
    }
  });

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep the first one)
  const activeMatches = [];
  matches.forEach((match) => {
    const isOverlapping = activeMatches.some(
      (active) =>
        (match.start >= active.start && match.start < active.end) ||
        (match.end > active.start && match.end <= active.end)
    );

    if (!isOverlapping) {
      activeMatches.push(match);
    }
  });

  // Build the output
  currentPos = 0;
  activeMatches.forEach((match) => {
    if (currentPos < match.start) {
      parts.push({
        type: "text",
        content: text.substring(currentPos, match.start),
      });
    }

    parts.push({
      type: match.tag,
      content: match.text,
    });

    currentPos = match.end;
  });

  if (currentPos < text.length) {
    parts.push({
      type: "text",
      content: text.substring(currentPos),
    });
  }

  return parts;
};

/**
 * Render markdown parts as JSX elements
 */
export const renderMarkdownJSX = (text) => {
  const parts = parseMarkdown(text);

  return parts.map((part, index) => {
    switch (part.type) {
      case "bold":
        return <strong key={index}>{part.content}</strong>;
      case "italic":
        return <em key={index}>{part.content}</em>;
      case "bold-italic":
        return (
          <strong key={index}>
            <em>{part.content}</em>
          </strong>
        );
      case "code":
        return (
          <code
            key={index}
            className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-xs"
          >
            {part.content}
          </code>
        );
      case "text":
      default:
        return <span key={index}>{part.content}</span>;
    }
  });
};

/**
 * Render markdown as plain HTML string (for dangerouslySetInnerHTML)
 */
export const renderMarkdownHTML = (text) => {
  if (!text) return "";

  // Handle bold-italic first
  let html = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");

  // Handle bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Handle italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Handle code
  html = html.replace(
    /`(.+?)`/g,
    '<code style="background-color: #d1d5db; padding: 0.375rem 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem;">$1</code>'
  );

  return html;
};
