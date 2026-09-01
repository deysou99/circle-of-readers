import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  BookOpen,
  Users,
  Search,
  Bell,
  Home,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Trash2,
  Pencil,
  Flag,
  Plus,
  Star,
} from "lucide-react";
import {
  ActivityGrid,
  Alert,
  AreaSpark,
  Badge,
  BarChart,
  Breadcrumbs,
  Button,
  CardHeader,
  Checkbox,
  ConfirmDialog,
  ContextMenu,
  DonutChart,
  Drawer,
  DropdownMenu,
  EmptyState,
  Field,
  FileUpload,
  GradientHighlightCard,
  IconButton,
  MetricCard,
  Modal,
  Pagination,
  Popover,
  ProgressBar,
  ProgressRing,
  Radio,
  SectionHeading,
  SegmentedControl,
  Select,
  SideNav,
  Skeleton,
  Slider,
  Spinner,
  StatusDot,
  Surface,
  Tabs,
  TextArea,
  TextInput,
  Toggle,
  Tooltip,
} from "@/components/ds";

export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [
      { title: "Circle Design System — Tokens & Components" },
      {
        name: "description",
        content:
          "The Circle design language: gradient tokens, colour and type scales, and every reusable component used across the reading community app.",
      },
      { property: "og:title", content: "Circle Design System — Tokens & Components" },
      {
        property: "og:description",
        content: "Gradient-first tokens, typography, and the full Circle component library.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DesignSystemPage,
});

const SECTIONS = [
  { id: "foundations", label: "Foundations" },
  { id: "colour", label: "Colour" },
  { id: "gradients", label: "Gradients" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing & radius" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "navigation", label: "Navigation" },
  { id: "cards", label: "Cards" },
  { id: "feedback", label: "Badges & alerts" },
  { id: "overlays", label: "Overlays" },
  { id: "charts", label: "Data viz" },
  { id: "loading", label: "Loading" },
  { id: "icons", label: "Icons" },
];

const SEMANTIC_COLOURS = [
  { token: "--surface", role: "Standard card surface" },
  { token: "--surface-elevated", role: "Modals, popovers" },
  { token: "--surface-sunken", role: "Wells, inputs backdrop" },
  { token: "--brand-primary", role: "Primary action" },
  { token: "--brand-primary-hover", role: "Primary hover" },
  { token: "--brand-secondary", role: "Soft blue accent" },
  { token: "--text-primary", role: "Headings & body" },
  { token: "--text-secondary", role: "Supporting copy" },
  { token: "--text-muted", role: "Captions, metadata" },
  { token: "--border-subtle", role: "Card hairlines" },
  { token: "--border-default", role: "Inputs, dividers" },
  { token: "--border-strong", role: "Outline buttons" },
  { token: "--success", role: "Finished a book" },
  { token: "--warning", role: "Behind schedule" },
  { token: "--error", role: "Destructive & failures" },
  { token: "--info", role: "Club announcements" },
];

const GRADIENTS = [
  { cls: "bg-gradient-primary", token: "--gradient-primary", role: "Primary CTAs" },
  { cls: "bg-gradient-warm", token: "--gradient-warm", role: "Streaks, energy" },
  { cls: "bg-gradient-cool", token: "--gradient-cool", role: "Progress, calm data" },
  { cls: "bg-gradient-success", token: "--gradient-success", role: "Completion states" },
  { cls: "bg-gradient-feature", token: "--gradient-feature", role: "Feature highlight cards" },
  { cls: "bg-gradient-dusk", token: "--gradient-dusk", role: "Event heroes" },
  { cls: "bg-gradient-subtle", token: "--gradient-surface-subtle", role: "Selected surfaces" },
  { cls: "bg-gradient-ink", token: "--gradient-ink", role: "Dark containers" },
];

const TYPE_SCALE = [
  { cls: "type-display", label: "Display", sample: "Read together." },
  { cls: "type-h1", label: "H1", sample: "The Midnight Library Circle" },
  { cls: "type-h2", label: "H2", sample: "This month in your clubs" },
  { cls: "type-h3", label: "H3", sample: "Chapter 12 discussion" },
  { cls: "type-h4", label: "H4", sample: "Members reading now" },
  { cls: "type-body-lg", label: "Body large", sample: "Twelve readers finished part two this week." },
  { cls: "type-body", label: "Body", sample: "Nora finds a library between life and death, and every book is a life she could have lived." },
  { cls: "type-body-sm", label: "Body small", sample: "Last active 3 hours ago · 214 pages read" },
  { cls: "type-label", label: "Label", sample: "Currently reading" },
  { cls: "type-caption", label: "Caption", sample: "Updated 12 minutes ago" },
];

const SPACING = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80];
const RADII = [
  { token: "--radius-xs", label: "XS · inputs" },
  { token: "--radius-s", label: "S · buttons" },
  { token: "--radius-m", label: "M · menus" },
  { token: "--radius-l", label: "L · cards" },
  { token: "--radius-xl", label: "XL · modals" },
  { token: "--radius-pill", label: "Pill · badges" },
];

const ICONS = [
  { Icon: Home, name: "Home" },
  { Icon: BookOpen, name: "BookOpen" },
  { Icon: Users, name: "Users" },
  { Icon: Search, name: "Search" },
  { Icon: Bell, name: "Bell" },
  { Icon: Heart, name: "Heart" },
  { Icon: MessageCircle, name: "MessageCircle" },
  { Icon: Share2, name: "Share2" },
  { Icon: Sparkles, name: "Sparkles" },
  { Icon: Star, name: "Star" },
  { Icon: Pencil, name: "Pencil" },
  { Icon: Trash2, name: "Trash2" },
];

function Section({ id, eyebrow, title, description, children }: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-12">
      <SectionHeading eyebrow={eyebrow} title={title} {...(description ? { description } : {})} />
      {children}
    </section>
  );
}

function Specimen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="type-caption text-[var(--text-muted)]">{label}</p>
      {children}
    </div>
  );
}

function DesignSystemPage() {
  const [tab, setTab] = React.useState("overview");
  const [segment, setSegment] = React.useState("week");
  const [nav, setNav] = React.useState("home");
  const [page, setPage] = React.useState(2);
  const [notify, setNotify] = React.useState(true);
  const [pages, setPages] = React.useState(240);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const menuItems = [
    { id: "edit", label: "Edit post", icon: <Pencil className="h-4 w-4" aria-hidden /> },
    { id: "share", label: "Share to a club", icon: <Share2 className="h-4 w-4" aria-hidden /> },
    { id: "report", label: "Report", icon: <Flag className="h-4 w-4" aria-hidden />, separatorBefore: true },
    { id: "delete", label: "Delete post", icon: <Trash2 className="h-4 w-4" aria-hidden />, tone: "destructive" as const },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-s)] bg-gradient-primary text-white">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="type-label leading-none">Circle Design System</p>
              <p className="type-caption text-[var(--text-muted)]">by MyFlip</p>
            </div>
          </div>
          <Badge variant="gradient">v1.0</Badge>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-3">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap rounded-[var(--radius-pill)] px-3 py-1.5 type-caption text-[var(--text-secondary)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--text-primary)]"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        {/* Foundations */}
        <section id="foundations" className="scroll-mt-24 pt-12">
          <GradientHighlightCard
            eyebrow="Design foundation"
            title="A gradient-first language for a reading community"
            description="Bold, warm and human. Gradients signal importance, progress and energy — everything else stays calm so the books lead."
            action={<Button variant="secondary" leadingIcon={<BookOpen className="h-4 w-4" aria-hidden />}>Read the principles</Button>}
          />
        </section>

        {/* Colour */}
        <Section id="colour" eyebrow="Tokens" title="Colour" description="Semantic tokens only — never raw hex in product code.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SEMANTIC_COLOURS.map((c) => (
              <Surface key={c.token} padding="sm" radius="m">
                <div
                  className="h-14 w-full rounded-[var(--radius-s)] border border-[var(--border-subtle)]"
                  style={{ background: `var(${c.token})` }}
                  aria-hidden
                />
                <p className="type-label mt-3">{c.token}</p>
                <p className="type-caption text-[var(--text-muted)]">{c.role}</p>
              </Surface>
            ))}
          </div>
        </Section>

        {/* Gradients */}
        <Section id="gradients" eyebrow="Tokens" title="Gradient library" description="Eight reusable gradients. Reserve the primary gradient for the single most important action on a surface.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GRADIENTS.map((g) => (
              <Surface key={g.token} padding="sm" radius="m">
                <div className={`h-20 w-full rounded-[var(--radius-s)] ${g.cls}`} aria-hidden />
                <p className="type-label mt-3">{g.cls}</p>
                <p className="type-caption text-[var(--text-muted)]">{g.role}</p>
              </Surface>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section id="typography" eyebrow="Tokens" title="Typography" description="Outfit for display and headings, Manrope for body, labels and UI copy.">
          <Surface radius="l" padding="lg" className="space-y-6">
            {TYPE_SCALE.map((t) => (
              <div key={t.cls} className="border-b border-[var(--border-subtle)] pb-5 last:border-0 last:pb-0">
                <p className="type-caption text-[var(--text-muted)]">{t.label} · .{t.cls}</p>
                <p className={`${t.cls} mt-2`}>{t.sample}</p>
              </div>
            ))}
          </Surface>
        </Section>

        {/* Spacing */}
        <Section id="spacing" eyebrow="Tokens" title="Spacing & radius" description="A 4px-based rhythm and a six-step corner scale.">
          <div className="grid gap-6 lg:grid-cols-2">
            <Surface radius="l" padding="lg" className="space-y-3">
              {SPACING.map((s) => (
                <div key={s} className="flex items-center gap-4">
                  <span className="type-caption w-14 text-[var(--text-muted)]">{s}px</span>
                  <span className="h-3 rounded-[var(--radius-pill)] bg-gradient-warm" style={{ width: s * 3 }} aria-hidden />
                </div>
              ))}
            </Surface>
            <Surface radius="l" padding="lg">
              <div className="grid grid-cols-3 gap-4">
                {RADII.map((r) => (
                  <div key={r.token} className="space-y-2">
                    <div
                      className="h-16 w-full border border-[var(--border-default)] bg-gradient-subtle"
                      style={{ borderRadius: `var(${r.token})` }}
                      aria-hidden
                    />
                    <p className="type-caption text-[var(--text-muted)]">{r.label}</p>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </Section>

        {/* Buttons */}
        <Section id="buttons" eyebrow="Components" title="Buttons" description="Six variants, four sizes, every interaction state.">
          <div className="grid gap-6 lg:grid-cols-2">
            <Surface radius="l" padding="lg" className="space-y-6">
              <Specimen label="Variants">
                <div className="flex flex-wrap gap-3">
                  <Button>Join the club</Button>
                  <Button variant="secondary">Save for later</Button>
                  <Button variant="outline">Preview</Button>
                  <Button variant="ghost">Skip</Button>
                  <Button variant="destructive">Leave club</Button>
                  <Button variant="success">Mark finished</Button>
                </div>
              </Specimen>
              <Specimen label="Sizes">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <IconButton label="Add a post" icon={<Plus className="h-4 w-4" aria-hidden />} />
                </div>
              </Specimen>
              <Specimen label="States">
                <div className="flex flex-wrap gap-3">
                  <Button loading>Publishing</Button>
                  <Button disabled>Disabled</Button>
                  <Button variant="secondary" className="ring-2 ring-[var(--state-focus-ring)]">Focus-visible</Button>
                  <Button variant="outline" trailingIcon={<Share2 className="h-4 w-4" aria-hidden />}>With icon</Button>
                </div>
              </Specimen>
            </Surface>
            <Surface radius="l" padding="lg">
              <CardHeader
                eyebrow="In context"
                title="Finish “Tomorrow, and Tomorrow, and Tomorrow”"
                description="You're 68% through. The club discusses part four on Sunday."
              />
              <ProgressBar value={68} label="Reading progress" />
              <div className="mt-6 flex gap-3">
                <Button block>Continue reading</Button>
                <Button variant="secondary" block>Add a note</Button>
              </div>
            </Surface>
          </div>
        </Section>

        {/* Inputs */}
        <Section id="inputs" eyebrow="Components" title="Inputs" description="Form controls with default, focus, error, success and disabled treatments.">
          <div className="grid gap-6 lg:grid-cols-2">
            <Surface radius="l" padding="lg" className="space-y-5">
              <Field label="Club name" hint="Members will see this everywhere" required htmlFor="ds-club">
                <TextInput id="ds-club" defaultValue="Sunday Morning Sci-Fi" />
              </Field>
              <Field label="Find a reader" htmlFor="ds-search">
                <TextInput id="ds-search" placeholder="Search readers" leadingIcon={<Search className="h-4 w-4" aria-hidden />} />
              </Field>
              <Field label="Email" error="That email is already part of Circle." htmlFor="ds-email">
                <TextInput id="ds-email" state="error" defaultValue="amara@myflip.app" />
              </Field>
              <Field label="Username" success="circle.co/amara is available" htmlFor="ds-user">
                <TextInput id="ds-user" state="success" defaultValue="amara" />
              </Field>
              <Field label="Invite code" hint="Locked while your club is public" htmlFor="ds-code">
                <TextInput id="ds-code" disabled value="CIRCLE-2026" readOnly />
              </Field>
            </Surface>
            <Surface radius="l" padding="lg" className="space-y-5">
              <Field label="Why this book?" htmlFor="ds-note">
                <TextArea id="ds-note" defaultValue="It reframes grief as a library of unlived lives — perfect for our winter reads." />
              </Field>
              <Field label="Reading pace" htmlFor="ds-pace">
                <Select id="ds-pace" defaultValue="chapter">
                  <option value="chapter">A chapter a day</option>
                  <option value="weekly">50 pages a week</option>
                  <option value="free">Read at my own pace</option>
                </Select>
              </Field>
              <div className="space-y-3">
                <Checkbox label="Email me discussion recaps" description="One digest per club, every Sunday" defaultChecked />
                <Radio name="ds-visibility" label="Public club" defaultChecked />
                <Radio name="ds-visibility" label="Invite only" />
              </div>
              <div className="flex items-center justify-between">
                <span className="type-body">New message alerts</span>
                <Toggle label="New message alerts" checked={notify} onCheckedChange={setNotify} />
              </div>
              <Slider label="Yearly page goal" value={pages} onValueChange={setPages} min={0} max={500} />
              <FileUpload />
            </Surface>
          </div>
        </Section>

        {/* Navigation */}
        <Section id="navigation" eyebrow="Components" title="Navigation" description="Calm chrome with gradient accents on the active state only.">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <Surface radius="l" padding="lg" className="space-y-6">
              <Breadcrumbs items={[{ label: "Clubs", href: "#" }, { label: "Sunday Morning Sci-Fi", href: "#" }, { label: "Chapter 12" }]} />
              <Tabs
                tabs={[
                  { id: "overview", label: "Overview" },
                  { id: "discussion", label: "Discussion" },
                  { id: "members", label: "Members" },
                  { id: "events", label: "Events" },
                ]}
                value={tab}
                onValueChange={setTab}
              />
              <p className="type-body-sm text-[var(--text-secondary)]">Showing the “{tab}” panel for Sunday Morning Sci-Fi.</p>
              <SegmentedControl
                options={[
                  { id: "week", label: "This week" },
                  { id: "month", label: "This month" },
                  { id: "year", label: "2026" },
                ]}
                value={segment}
                onValueChange={setSegment}
              />
              <Pagination page={page} pageCount={5} onPageChange={setPage} />
            </Surface>
            <Surface radius="l" padding="md">
              <SideNav
                items={[
                  { id: "home", label: "Home", icon: <Home className="h-4 w-4" aria-hidden /> },
                  { id: "clubs", label: "My clubs", icon: <Users className="h-4 w-4" aria-hidden />, badge: "3" },
                  { id: "books", label: "My books", icon: <BookOpen className="h-4 w-4" aria-hidden /> },
                  { id: "messages", label: "Messages", icon: <MessageCircle className="h-4 w-4" aria-hidden />, badge: "12" },
                ]}
                value={nav}
                onValueChange={setNav}
              />
            </Surface>
          </div>
        </Section>

        {/* Cards */}
        <Section id="cards" eyebrow="Components" title="Cards & surfaces" description="Standard, interactive, metric, gradient and empty-state containers.">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Surface radius="l" padding="md">
              <CardHeader eyebrow="Currently reading" title="Piranesi" description="Susanna Clarke · 245 pages" />
              <div className="mt-5"><ProgressBar value={42} tone="cool" label="42% complete" /></div>
            </Surface>
            <Surface variant="interactive" radius="l" padding="md">
              <CardHeader eyebrow="Club" title="Sunday Morning Sci-Fi" description="1,204 members · meets weekly" />
              <div className="mt-5 flex gap-2">
                <Badge variant="brand">Sci-fi</Badge>
                <Badge variant="outline">Weekly</Badge>
              </div>
            </Surface>
            <MetricCard label="Reading streak" value="34 days" delta="+6 this week" icon={<Sparkles className="h-4 w-4" aria-hidden />} />
            <MetricCard label="Books finished" value="21" delta="Goal: 30" trend="flat" icon={<BookOpen className="h-4 w-4" aria-hidden />} />
            <Surface variant="gradient" radius="l" padding="lg">
              <p className="type-caption opacity-80">Event</p>
              <h3 className="type-h3 mt-2">Live discussion · Sunday 19:00</h3>
              <p className="type-body-sm mt-2 opacity-85">Part four of Tomorrow, and Tomorrow, and Tomorrow.</p>
            </Surface>
            <EmptyState
              icon={<BookOpen className="h-6 w-6" aria-hidden />}
              title="No books saved yet"
              description="Save books you want to read and they'll show up here for your clubs to see."
              action={<Button size="sm">Browse recommendations</Button>}
            />
          </div>
        </Section>

        {/* Feedback */}
        <Section id="feedback" eyebrow="Components" title="Badges, tags & alerts" description="Status stays semantic — colour is never the only signal.">
          <div className="grid gap-6 lg:grid-cols-2">
            <Surface radius="l" padding="lg" className="space-y-6">
              <Specimen label="Badges">
                <div className="flex flex-wrap gap-2">
                  <Badge>Fiction</Badge>
                  <Badge variant="brand">Club pick</Badge>
                  <Badge variant="gradient">New</Badge>
                  <Badge variant="success">Finished</Badge>
                  <Badge variant="warning">Behind pace</Badge>
                  <Badge variant="error">Paused</Badge>
                  <Badge variant="info">Announcement</Badge>
                  <Badge variant="outline">Non-fiction</Badge>
                </div>
              </Specimen>
              <Specimen label="Presence">
                <div className="flex flex-wrap gap-5">
                  <StatusDot status="online" label="Amara · reading now" />
                  <StatusDot status="away" label="Jonas · away" />
                  <StatusDot status="offline" label="Priya · offline" />
                </div>
              </Specimen>
              <Specimen label="Progress">
                <div className="flex items-center gap-8">
                  <ProgressRing value={72} label="Yearly goal" />
                  <div className="flex-1 space-y-4">
                    <ProgressBar value={90} tone="success" label="Chapter target" />
                    <ProgressBar value={35} tone="cool" label="Club average" />
                  </div>
                </div>
              </Specimen>
            </Surface>
            <div className="space-y-4">
              <Alert tone="info" title="New chapter target posted">Read to chapter 14 before Sunday's discussion.</Alert>
              <Alert tone="success" title="You finished Piranesi">Add a review so your club can see your take.</Alert>
              <Alert tone="warning" title="You're two chapters behind">Catch up before the live session to avoid spoilers.</Alert>
              <Alert
                tone="error"
                title="Couldn't post your update"
                action={<Button size="sm" variant="secondary">Try again</Button>}
              >
                Your connection dropped while publishing.
              </Alert>
            </div>
          </div>
        </Section>

        {/* Overlays */}
        <Section id="overlays" eyebrow="Components" title="Modals & overlays" description="Dialogs, drawers, popovers and menus share one elevated surface.">
          <Surface radius="l" padding="lg">
            <div className="flex flex-wrap gap-3">
              <Modal
                trigger={<Button>Create a post</Button>}
                title="Share with your circle"
                description="Attach a book so readers can jump straight to it."
                footer={
                  <>
                    <Button variant="ghost">Save draft</Button>
                    <Button>Publish</Button>
                  </>
                }
              >
                <TextArea defaultValue="Just finished part three — that twist reframes the whole first act." />
              </Modal>

              <ConfirmDialog
                trigger={<Button variant="destructive">Leave club</Button>}
                title="Leave Sunday Morning Sci-Fi?"
                description="You'll lose access to the group chat and this month's reading schedule."
                confirmLabel="Leave club"
                tone="destructive"
              />

              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open filters drawer</Button>
              <Drawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                title="Filter your timeline"
                description="Narrow your feed to the clubs and formats you care about."
                footer={<Button onClick={() => setDrawerOpen(false)}>Apply filters</Button>}
              >
                <div className="space-y-3">
                  <Checkbox label="Progress updates" defaultChecked />
                  <Checkbox label="Reviews" defaultChecked />
                  <Checkbox label="Quotes" />
                  <Checkbox label="Club events" defaultChecked />
                </div>
              </Drawer>

              <Popover
                trigger={<Button variant="outline">Reading pace</Button>}
              >
                <p className="type-label">Set a weekly pace</p>
                <p className="type-body-sm mt-1 text-[var(--text-secondary)]">
                  Circle nudges you when you fall behind your club.
                </p>
                <div className="mt-4"><ProgressBar value={55} label="50 pages / week" /></div>
              </Popover>

              <DropdownMenu label="Post actions" trigger={<Button variant="ghost">Post menu</Button>} items={menuItems} />

              <Tooltip label="Only club members can see this">
                <Button variant="ghost">Hover me</Button>
              </Tooltip>
            </div>

            <ContextMenu items={menuItems}>
              <div className="mt-6 rounded-[var(--radius-m)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-sunken)] px-6 py-8 text-center">
                <p className="type-label">Right-click this post card</p>
                <p className="type-body-sm mt-1 text-[var(--text-muted)]">Context menus mirror the dropdown menu styling.</p>
              </div>
            </ContextMenu>
          </Surface>
        </Section>

        {/* Charts */}
        <Section id="charts" eyebrow="Components" title="Data visualisation" description="Gradients carry the featured series; everything else stays neutral.">
          <div className="grid gap-6 md:grid-cols-2">
            <Surface radius="l" padding="lg">
              <CardHeader title="Pages read" description="Last 12 weeks" />
              <div className="mt-4"><AreaSpark points={[12, 40, 28, 62, 55, 80, 74, 96, 88, 120, 104, 138]} label="Pages read per week" /></div>
            </Surface>
            <Surface radius="l" padding="lg">
              <CardHeader title="Books by month" description="2026 so far" />
              <div className="mt-4">
                <BarChart
                  label="Books finished per month"
                  data={[
                    { label: "Jan", value: 3 },
                    { label: "Feb", value: 2 },
                    { label: "Mar", value: 4 },
                    { label: "Apr", value: 5 },
                    { label: "May", value: 3 },
                    { label: "Jun", value: 4 },
                  ]}
                />
              </div>
            </Surface>
            <Surface radius="l" padding="lg">
              <CardHeader title="Genres you read" description="All time" />
              <div className="mt-4">
                <DonutChart
                  label="Genre split"
                  segments={[
                    { label: "Literary fiction", value: 42, color: "var(--data-primary)" },
                    { label: "Sci-fi", value: 28, color: "var(--data-secondary)" },
                    { label: "Memoir", value: 18, color: "var(--data-positive)" },
                    { label: "Poetry", value: 12, color: "var(--data-neutral)" },
                  ]}
                />
              </div>
            </Surface>
            <Surface radius="l" padding="lg">
              <CardHeader title="Reading streak" description="Every day you opened a book" />
              <div className="mt-4"><ActivityGrid label="Daily reading activity" /></div>
            </Surface>
          </div>
        </Section>

        {/* Loading */}
        <Section id="loading" eyebrow="Components" title="Loading states" description="Skeletons mirror the final layout so nothing jumps.">
          <div className="grid gap-6 md:grid-cols-2">
            <Surface radius="l" padding="lg" className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-10 rounded-[var(--radius-xs)]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-3/4" />
            </Surface>
            <Surface radius="l" padding="lg" className="flex items-center justify-center gap-8">
              <Spinner label="Loading your clubs" />
              <Button loading variant="secondary">Syncing</Button>
            </Surface>
          </div>
        </Section>

        {/* Icons */}
        <Section id="icons" eyebrow="Foundation" title="Iconography" description="Lucide, 1.5px stroke, neutral by default — brand colour only for emphasis.">
          <Surface radius="l" padding="lg">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {ICONS.map(({ Icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-2 rounded-[var(--radius-m)] border border-[var(--border-subtle)] p-4">
                  <Icon className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden />
                  <span className="type-caption text-[var(--text-muted)]">{name}</span>
                </div>
              ))}
            </div>
          </Surface>
        </Section>
      </main>
    </div>
  );
}
