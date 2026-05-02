/**
 * @onegov/ui — public barrel.
 *
 * v0.2.0 design system: every component is named-exported and tree-shakeable.
 * Site modules and the popup compose from this one entry point. Renderer +
 * theme remain backward-compatible with v0.1 callers.
 *
 * The full catalog with usage examples lives in `docs/design-system.md`.
 * The visual playground is `packages/ui/playground/index.html`.
 */

// Renderer + theme (legacy public surface — preserved)
export { render } from './renderer.js';
export { THEME_CSS, themeFor } from './theme.js';

// Design tokens
export {
  tokens,
  colors,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  spacing,
  radius,
  shadows,
  motion,
  breakpoints,
  zIndex,
  focus,
  targetSize,
} from './tokens.js';
export type { DesignTokens } from './tokens.js';

// Layout primitives
export { Stack } from './components/Stack.js';
export { Cluster } from './components/Cluster.js';
export { Inline } from './components/Inline.js';
export { Container } from './components/Container.js';
export { AppShell } from './components/AppShell.js';

// Typography
export { Heading } from './components/Heading.js';
export { Paragraph } from './components/Paragraph.js';
export { Text } from './components/Text.js';
export { Kbd } from './components/Kbd.js';

// Actions
export { Button } from './components/Button.js';
export { Link, sanitizeHref } from './components/Link.js';

// Form primitives
export { Input } from './components/Input.js';
export { Textarea } from './components/Textarea.js';
export { Select } from './components/Select.js';
export type { SelectOption } from './components/Select.js';
export { Combobox } from './components/Combobox.js';
export { Checkbox } from './components/Checkbox.js';
export { Radio, RadioGroup } from './components/Radio.js';
export { Switch } from './components/Switch.js';
export { FormField } from './components/FormField.js';
export { FormActions } from './components/FormActions.js';
export { Form } from './components/Form.js';
export type { FormFieldDescriptor } from './components/types.js';

// Surfaces
export { Card, CardHeader, CardBody, CardFooter, CardMedia } from './components/Card.js';
export { Panel } from './components/Panel.js';
export { Box } from './components/Box.js';
export { Callout } from './components/Callout.js';
export { Banner } from './components/Banner.js';

// Overlays
export { Modal } from './components/Modal.js';
export { Popover } from './components/Popover.js';
export { Tooltip } from './components/Tooltip.js';

// Disclosure
export { Accordion } from './components/Accordion.js';
export type { AccordionItem } from './components/Accordion.js';
export { Tabs } from './components/Tabs.js';
export type { TabDefinition } from './components/Tabs.js';

// Navigation
export { TopNav } from './components/TopNav.js';
export type { NavItem } from './components/TopNav.js';
export { SideNav } from './components/SideNav.js';
export type { SideNavItem, SideNavSection } from './components/SideNav.js';
export { Breadcrumb } from './components/Breadcrumb.js';
export type { BreadcrumbItem } from './components/Breadcrumb.js';
export { Pagination } from './components/Pagination.js';
export { Footer, FooterColumn } from './components/Footer.js';

// Data display
export {
  Table,
  TableShell,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortHeader,
} from './components/Table.js';
export {
  List,
  ActionList,
  DefinitionList,
} from './components/List.js';
export type { ActionListItem, DefinitionListEntry } from './components/List.js';
export { Badge } from './components/Badge.js';
export { Avatar } from './components/Avatar.js';
export { StatusIndicator } from './components/StatusIndicator.js';
export { Divider } from './components/Divider.js';

// Feedback
export { Spinner } from './components/Spinner.js';
export { ProgressBar } from './components/ProgressBar.js';
export { Skeleton, SkeletonText } from './components/Skeleton.js';
export { Alert } from './components/Alert.js';
export { EmptyState } from './components/EmptyState.js';

// Page primitives
export { Hero } from './components/Hero.js';
export { CardGrid } from './components/CardGrid.js';
export { SearchBox } from './components/SearchBox.js';
export type { SearchSuggestion } from './components/SearchBox.js';
