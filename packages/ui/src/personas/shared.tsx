/**
 * Shared rendering helpers for persona layouts.
 *
 * `renderNode` dispatches a single `SemanticNode` to the matching atomic
 * component. All four persona layouts use it; they differ in container
 * structure, ordering, and which nodes get emphasised.
 *
 * Data extracted from rule packs is always passed through JSX text — never
 * `innerHTML`. The dispatcher tolerates missing fields by rendering
 * placeholders rather than throwing, so a malformed pack degrades to "less
 * useful" instead of "page broken".
 */

import type { Persona, SemanticNode } from '@onegov/core';

import { Heading } from '../components/Heading.js';
import { Paragraph } from '../components/Paragraph.js';
import { List } from '../components/List.js';
import { Table } from '../components/Table.js';
import { Form } from '../components/Form.js';
import { Link } from '../components/Link.js';
import type { FormFieldDescriptor } from '../components/types.js';

/** Pull a string value defensively — anything non-string becomes empty. */
function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Pull a string array defensively. */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/** Pull a 2-D string array defensively (for Table rows). */
function asStringMatrix(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.filter((cell): cell is string => typeof cell === 'string'));
}

/** Pull form fields defensively — only well-typed entries survive. */
function asFields(value: unknown): FormFieldDescriptor[] {
  if (!Array.isArray(value)) return [];
  const out: FormFieldDescriptor[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const f = item as Record<string, unknown>;
    if (typeof f['name'] !== 'string') continue;
    const t = f['type'];
    const allowed = ['text', 'email', 'tel', 'url', 'number', 'date', 'textarea', 'select'];
    const type = typeof t === 'string' && allowed.includes(t) ? (t as FormFieldDescriptor['type']) : 'text';
    out.push({
      name: f['name'],
      type,
      ...(typeof f['label'] === 'string' ? { label: f['label'] } : {}),
      ...(typeof f['value'] === 'string' ? { value: f['value'] } : {}),
      ...(typeof f['placeholder'] === 'string' ? { placeholder: f['placeholder'] } : {}),
      ...(typeof f['hint'] === 'string' ? { hint: f['hint'] } : {}),
      ...(typeof f['required'] === 'boolean' ? { required: f['required'] } : {}),
    });
  }
  return out;
}

interface NodeProps {
  node: SemanticNode;
  persona: Persona;
  /** Optional level override for headings inside an emphasised slot. */
  headingLevel?: 1 | 2 | 3;
}

export function RenderedNode({ node, persona, headingLevel }: NodeProps) {
  switch (node.type) {
    case 'heading': {
      const text = asString(node.data['text']);
      const lvlRaw = node.data['level'];
      const level: 1 | 2 | 3 = headingLevel ?? (lvlRaw === 2 ? 2 : lvlRaw === 3 ? 3 : 1);
      return <Heading text={text} level={level} persona={persona} />;
    }
    case 'paragraph': {
      const text = asString(node.data['text']);
      const muted = node.data['muted'] === true;
      return <Paragraph text={text} muted={muted} persona={persona} />;
    }
    case 'list': {
      const items = asStringArray(node.data['items']);
      const ordered = node.data['ordered'] === true;
      return <List items={items} ordered={ordered} persona={persona} />;
    }
    case 'table': {
      const headers = asStringArray(node.data['headers']);
      const rows = asStringMatrix(node.data['rows']);
      return <Table headers={headers} rows={rows} persona={persona} />;
    }
    case 'form': {
      const fields = asFields(node.data['fields']);
      const id = typeof node.data['id'] === 'string' ? node.data['id'] : undefined;
      const action = typeof node.data['action'] === 'string' ? node.data['action'] : undefined;
      const formProps: { fields: FormFieldDescriptor[]; persona: Persona; id?: string; action?: string } = {
        fields,
        persona,
      };
      if (id !== undefined) formProps.id = id;
      if (action !== undefined) formProps.action = action;
      return <Form {...formProps} />;
    }
    case 'link': {
      const text = asString(node.data['text']);
      const href = asString(node.data['href']);
      return <Link text={text} href={href} persona={persona} />;
    }
    case 'image': {
      // Images: render as alt text only in v0.1 — we can't fetch arbitrary
      // image URLs from a content script without expanding host_permissions
      // (invariant #4). The alt text is enough for accessibility and for the
      // visual harness to show what would render.
      const alt = asString(node.data['alt']);
      return <p class="onegov-p onegov-p--muted">[imagine: {alt || 'fără descriere'}]</p>;
    }
    default:
      return null;
  }
}
