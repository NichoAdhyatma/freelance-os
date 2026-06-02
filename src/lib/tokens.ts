/**
 * Design token helpers — single source of truth for all status colors.
 *
 * Usage:
 *   import { getStatusStyle, PRIORITY_CONFIG, PROJECT_STATUS_CONFIG } from '@/lib/tokens';
 *
 *   <span {...getStatusStyle(PRIORITY_CONFIG, 'high')} />
 */

export type PriorityKey = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatusKey = 'backlog' | 'in_progress' | 'review' | 'done';
export type InvoiceStatusKey = 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export const PRIORITY_CONFIG: Record<PriorityKey, StatusStyle> = {
  low:    { color: 'var(--status-neutral)', bg: 'var(--status-neutral-bg)', borderColor: 'var(--status-neutral)' },
  medium: { color: 'var(--status-info)',   bg: 'var(--status-info-bg)',   borderColor: 'var(--status-info)'   },
  high:   { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', borderColor: 'var(--status-warning)' },
  urgent: { color: 'var(--status-danger)',  bg: 'var(--status-danger-bg)',  borderColor: 'var(--status-danger)'  },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatusKey, StatusStyle> = {
  backlog:     { color: 'var(--status-neutral)', bg: 'var(--status-neutral-bg)', borderColor: 'var(--status-neutral)' },
  in_progress: { color: 'var(--status-info)',     bg: 'var(--status-info-bg)',     borderColor: 'var(--status-info)'     },
  review:     { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', borderColor: 'var(--status-warning)' },
  done:       { color: 'var(--status-success)', bg: 'var(--status-success-bg)', borderColor: 'var(--status-success)' },
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatusKey, StatusStyle> = {
  draft:     { color: 'var(--status-neutral)', bg: 'var(--status-neutral-bg)', borderColor: 'var(--status-neutral)' },
  pending:   { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', borderColor: 'var(--status-warning)' },
  sent:      { color: 'var(--status-info)',     bg: 'var(--status-info-bg)',     borderColor: 'var(--status-info)'     },
  paid:      { color: 'var(--status-success)', bg: 'var(--status-success-bg)', borderColor: 'var(--status-success)' },
  overdue:   { color: 'var(--status-danger)',  bg: 'var(--status-danger-bg)',  borderColor: 'var(--status-danger)'  },
  cancelled: { color: 'var(--status-neutral)', bg: 'var(--status-neutral-bg)', borderColor: 'var(--status-neutral)' },
};

// Label maps
export const PRIORITY_LABELS: Record<PriorityKey, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatusKey, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatusKey, string> = {
  draft: 'Draft',
  pending: 'Pending',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

// Avatar color palette — 6 distinct colors
export const AVATAR_COLORS: StatusStyle[] = [
  { color: 'var(--status-info)',     bg: 'var(--status-info-bg)',     borderColor: 'var(--status-info)'     },
  { color: 'oklch(0.6 0.18 320)',  bg: 'oklch(0.6 0.18 320 / 15%)',  borderColor: 'oklch(0.6 0.18 320 / 30%)'  }, // purple
  { color: 'var(--status-success)', bg: 'var(--status-success-bg)', borderColor: 'var(--status-success)' },
  { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', borderColor: 'var(--status-warning)' },
  { color: 'oklch(0.6 0.15 340)',  bg: 'oklch(0.6 0.15 340 / 15%)',  borderColor: 'oklch(0.6 0.15 340 / 30%)'  }, // pink
  { color: 'var(--status-info)',    bg: 'var(--status-info-bg)',     borderColor: 'var(--status-info)'     },
];

export function getAvatarStyle(name: string): StatusStyle {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Returns style props to spread onto a span/div for status badge styling.
 * Falls back to the first config entry if key not found.
 */
export function getStatusStyle(
  config: Record<string, StatusStyle>,
  key: string,
): React.HTMLAttributes<HTMLSpanElement> {
  const style = config[key] ?? Object.values(config)[0];
  return {
    style: {
      color: style.color,
      background: style.bg,
      borderColor: style.borderColor + '50',
    },
  };
}

// Helper: apply status style to a Badge-like element
// Usage: <span className="badge" {...statusStyle(PRIORITY_CONFIG, 'high')} />
export function statusStyle(config: Record<string, StatusStyle>, key: string) {
  const s = config[key] ?? Object.values(config)[0];
  return {
    style: {
      color: s.color,
      background: s.bg,
      borderColor: s.borderColor + '50',
    },
  };
}

import type React from 'react';

export interface StatusStyle {
  color: string;
  bg: string;
  borderColor: string;
}